use axum::{extract::{Path, State}, http::StatusCode, Json, body::Body, BoxError};
use crate::{models::{User, GroupSummary, DashboardStats, MaritalStatus, Confirmand, CreateConfirmand, Catechist, CreateCatechist, CatechistDetails, ConfirmationGroup, CreateConfirmationGroup, AddParticipantToGroup, ConfirmationGroupDetails, Sacrament, ConfirmandDetails, UpdateParticipantSacrament}, AppState, auth::AuthenticatedUser};
use csv::ReaderBuilder; // --- NEW ---
use std::io::Cursor; // --- NEW ---
use chrono::NaiveDate;
use serde_json::json; // --- NEW ---

// MODIFIED: The SELECT query now LEFT JOINs to find the current group for each participant.
pub async fn list_confirmands(user: AuthenticatedUser, State(state): State<AppState>) -> Result<Json<Vec<Confirmand>>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // --- MODIFICATION: The SQL query now also selects the group's start_date ---
    let sql = "
        SELECT DISTINCT ON (c.id)
            c.id, c.full_name, c.email, c.phone_number, c.creation_date, c.marital_status::TEXT as marital_status,
            c.birth_date, c.address, c.father_name, c.mother_name, c.baptism_church, c.communion_church,
            cg.id as current_group_id,
            cg.module as current_group_module,
            cg.start_date as current_group_start_date -- Added this line
        FROM confirmands c
        LEFT JOIN confirmand_confirmation_groups ccg ON c.id = ccg.confirmand_id
        LEFT JOIN confirmation_groups cg ON ccg.confirmation_group_id = cg.id
        ORDER BY c.id, cg.start_date DESC
    ";

    let rows = conn.query(sql, &[]).await.map_err(internal_error)?;
    let confirmands: Vec<Confirmand> = rows.into_iter().map(Confirmand::from).collect();
    Ok(Json(confirmands))
}
// MODIFICATION: The INSERT and RETURNING statements now include all columns.
pub async fn create_confirmand(
    user: AuthenticatedUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateConfirmand>,
) -> Result<(StatusCode, Json<Confirmand>), (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // Step 1: Insert the new record and return its ID. This part is correct.
    let insert_sql = "
        INSERT INTO confirmands (
            full_name, birth_date, address, phone_number, email, marital_status, 
            father_name, mother_name, baptism_church, communion_church
        ) 
        VALUES ($1, $2, $3, $4, $5, CAST($6 AS VARCHAR)::marital_status_enum, $7, $8, $9, $10) 
        RETURNING id
    ";
    let row = conn
        .query_one(
            insert_sql,
            &[
                &payload.full_name,
                &payload.birth_date,
                &payload.address,
                &payload.phone_number,
                &payload.email,
                &payload.marital_status.to_string(),
                &payload.father_name,
                &payload.mother_name,
                &payload.baptism_church,
                &payload.communion_church,
            ],
        )
        .await
        .map_err(internal_error)?;
    
    let new_id: i32 = row.get(0);

    // Step 2: Fetch the complete, newly created record.
    // THIS QUERY IS NOW CORRECTED to match the one in `list_confirmands`.
    let select_sql = "
        SELECT 
            c.id, c.full_name, c.email, c.phone_number, c.creation_date, c.marital_status::TEXT as marital_status,
            c.birth_date, c.address, c.father_name, c.mother_name, c.baptism_church, c.communion_church,
            cg.id as current_group_id,
            cg.module as current_group_module,
            cg.start_date as current_group_start_date -- This was the missing line
        FROM confirmands c
        LEFT JOIN confirmand_confirmation_groups ccg ON c.id = ccg.confirmand_id
        LEFT JOIN confirmation_groups cg ON ccg.confirmation_group_id = cg.id
        WHERE c.id = $1
    ";
    let new_confirmand_row = conn.query_one(select_sql, &[&new_id]).await.map_err(internal_error)?;

    let new_confirmand = Confirmand::from(new_confirmand_row);
    Ok((StatusCode::CREATED, Json(new_confirmand)))
}

pub async fn update_confirmand(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateConfirmand>,
) -> Result<Json<Confirmand>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // Step 1: Perform the UPDATE. We don't need a complex RETURNING clause.
    let update_sql = "
        UPDATE confirmands 
        SET 
           full_name = $1, birth_date = $2, address = $3, phone_number = $4, email = $5, 
           marital_status = CAST($6 AS VARCHAR)::marital_status_enum,
           father_name = $7, mother_name = $8, baptism_church = $9, communion_church = $10
        WHERE id = $11
    ";
    let result = conn.execute(update_sql, &[
        &payload.full_name,
        &payload.birth_date,
        &payload.address,
        &payload.phone_number,
        &payload.email,
        &payload.marital_status.to_string(),
        &payload.father_name,
        &payload.mother_name,
        &payload.baptism_church,
        &payload.communion_church,
        &id,
    ]).await.map_err(internal_error)?;

    if result == 0 {
        return Err((StatusCode::NOT_FOUND, format!("Participant with ID {} not found to update", id)));
    }

    // Step 2: Fetch the complete, updated record with the JOIN to get all fields, including group info.
    let select_sql = "
        SELECT 
            c.id, c.full_name, c.email, c.phone_number, c.creation_date, c.marital_status::TEXT as marital_status,
            c.birth_date, c.address, c.father_name, c.mother_name, c.baptism_church, c.communion_church,
            cg.id as current_group_id,
            cg.module as current_group_module
        FROM confirmands c
        LEFT JOIN confirmand_confirmation_groups ccg ON c.id = ccg.confirmand_id
        LEFT JOIN confirmation_groups cg ON ccg.confirmation_group_id = cg.id
        WHERE c.id = $1
    ";
    let updated_row = conn.query_one(select_sql, &[&id]).await.map_err(internal_error)?;
    
    let updated_confirmand = Confirmand::from(updated_row);
    Ok(Json(updated_confirmand))
}

pub async fn delete_confirmand(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let result = conn
        .execute("DELETE FROM confirmands WHERE id = $1", &[&id])
        .await
        .map_err(internal_error)?;
    if result == 0 {
        return Err((StatusCode::NOT_FOUND, format!("Participant with ID {} not found", id)));
    }
    Ok(StatusCode::NO_CONTENT)
}

// Handler for `GET /api/catechists`
pub async fn list_catechists(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
) -> Result<Json<Vec<Catechist>>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    
    // This query uses a Common Table Expression (CTE) with DISTINCT ON to find the most recent
    // group for each catechist based on the start_date.
    let sql = "
        WITH LatestGroup AS (
            SELECT DISTINCT ON (catechist_id)
                catechist_id,
                id as latest_group_id,
                module as latest_group_module,
                start_date as latest_group_start_date
            FROM confirmation_groups
            WHERE catechist_id IS NOT NULL
            ORDER BY catechist_id, start_date DESC
        )
        SELECT 
            c.id, c.full_name, c.currently_active,
            lg.latest_group_id,
            lg.latest_group_module,
            lg.latest_group_start_date
        FROM catechists c
        LEFT JOIN LatestGroup lg ON c.id = lg.catechist_id
        ORDER BY c.full_name
    ";

    let rows = conn.query(sql, &[]).await.map_err(internal_error)?;
    let catechists: Vec<Catechist> = rows.into_iter().map(Catechist::from).collect();
    Ok(Json(catechists))
}

pub async fn get_catechist_details(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<CatechistDetails>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // Step 1: Get the main catechist info (this query is correct)
    let catechist_sql = "
        WITH LatestGroup AS (
            SELECT DISTINCT ON (catechist_id)
                catechist_id, id as latest_group_id, module as latest_group_module, start_date as latest_group_start_date
            FROM confirmation_groups
            WHERE catechist_id IS NOT NULL
            ORDER BY catechist_id, start_date DESC
        )
        SELECT 
            c.id, c.full_name, c.currently_active,
            lg.latest_group_id, lg.latest_group_module, lg.latest_group_start_date
        FROM catechists c
        LEFT JOIN LatestGroup lg ON c.id = lg.catechist_id
        WHERE c.id = $1
    ";
    let catechist_row = conn.query_one(catechist_sql, &[&id]).await.map_err(internal_error)?;
    let catechist = Catechist::from(catechist_row);

    // Step 2: Get their entire group history
    // MODIFICATION 1: Added `cg.start_date` to the SELECT statement
    let history_sql = "
        SELECT 
            cg.id, 
            cg.module,
            cg.start_date,
            c.full_name as catechist_name
        FROM confirmation_groups cg
        LEFT JOIN catechists c ON cg.catechist_id = c.id
        WHERE cg.catechist_id = $1
        ORDER BY cg.start_date DESC
    ";
    let history_rows = conn.query(history_sql, &[&id]).await.map_err(internal_error)?;
    // MODIFICATION 2: Added `start_date` to the struct initialization
    let group_history: Vec<GroupSummary> = history_rows.into_iter().map(|row| GroupSummary {
        id: row.get("id"),
        module: row.get("module"),
        start_date: row.get("start_date"),
        catechist_name: row.get("catechist_name"),
    }).collect();

    // Step 3: Combine into the final response model (this part is correct)
    let details = CatechistDetails {
        catechist,
        group_history,
    };
    Ok(Json(details))
}

// Handler for `POST /api/catechists`
pub async fn create_catechist(
    user: AuthenticatedUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateCatechist>,
) -> Result<(StatusCode, Json<Catechist>), (StatusCode, String)> {
    println!("[CREATE CATECHIST] Auth successful for user: {}", user.id);
    let conn = state.get().await.map_err(internal_error)?;

    // Step 1: Insert the new catechist and only return its new ID.
    let insert_row = conn
        .query_one(
            "INSERT INTO catechists (full_name, currently_active) VALUES ($1, $2) RETURNING id",
            &[&payload.full_name, &payload.currently_active],
        )
        .await
        .map_err(internal_error)?;
    
    let new_id: i32 = insert_row.get(0);
    println!("[CREATE CATECHIST] Insert successful with new ID: {}", new_id);

    // Step 2: Fetch the complete, newly created record using the same advanced query from `list_catechists`.
    // This guarantees the returned object has the correct shape, including the calculated fields.
    let select_sql = "
        WITH LatestGroup AS (
            SELECT DISTINCT ON (catechist_id)
                catechist_id,
                id as latest_group_id,
                module as latest_group_module,
                start_date as latest_group_start_date
            FROM confirmation_groups
            WHERE catechist_id IS NOT NULL
            ORDER BY catechist_id, start_date DESC
        )
        SELECT 
            c.id, c.full_name, c.currently_active,
            lg.latest_group_id,
            lg.latest_group_module,
            lg.latest_group_start_date
        FROM catechists c
        LEFT JOIN LatestGroup lg ON c.id = lg.catechist_id
        WHERE c.id = $1
    ";
    
    let new_catechist_row = conn.query_one(select_sql, &[&new_id]).await.map_err(internal_error)?;
    let new_catechist = Catechist::from(new_catechist_row);
    println!("[CREATE CATECHIST] Returning new catechist object: {:?}", new_catechist);

    Ok((StatusCode::CREATED, Json(new_catechist)))
}

// Handler for `GET /api/groups`
pub async fn list_groups(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
) -> Result<Json<Vec<ConfirmationGroup>>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // This query joins confirmation_groups with catechists to get the catechist's name.
    // A LEFT JOIN is used so that groups without an assigned catechist are still listed.
    // We also cast the enum to TEXT for the driver.
    let sql = "
        SELECT 
            cg.id, cg.module, cg.catechist_id, cg.group_link, cg.start_date, cg.end_date,
            cg.day_of_the_week::TEXT as day_of_the_week,
            c.full_name as catechist_name
        FROM confirmation_groups cg
        LEFT JOIN catechists c ON cg.catechist_id = c.id
        ORDER BY cg.start_date DESC
    ";

    let rows = conn.query(sql, &[]).await.map_err(internal_error)?;

    let groups: Vec<ConfirmationGroup> = rows.into_iter().map(ConfirmationGroup::from).collect();
    Ok(Json(groups))
}

// Handler for `POST /api/groups`
pub async fn create_group(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
    Json(payload): Json<CreateConfirmationGroup>,
) -> Result<(StatusCode, Json<ConfirmationGroup>), (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    let insert_sql = "
        INSERT INTO confirmation_groups 
            (module, catechist_id, day_of_the_week, group_link, start_date, end_date)
        VALUES ($1, $2, CAST($3 AS VARCHAR)::day_of_week_enum, $4, $5, $6)
        RETURNING id
    ";

    // First, we insert the new group and get its ID back.
    let row = conn
        .query_one(
            insert_sql,
            &[
                &payload.module,
                &payload.catechist_id,
                &payload.day_of_the_week.to_string(),
                &payload.group_link,
                &payload.start_date,
                &payload.end_date,
            ],
        )
        .await
        .map_err(internal_error)?;
    
    let new_id: i32 = row.get(0);

    // Now, we fetch the newly created group using our JOIN query to get all the details.
    let select_sql = "
        SELECT 
            cg.id, cg.module, cg.catechist_id, cg.group_link, cg.start_date, cg.end_date,
            cg.day_of_the_week::TEXT as day_of_the_week,
            c.full_name as catechist_name
        FROM confirmation_groups cg
        LEFT JOIN catechists c ON cg.catechist_id = c.id
        WHERE cg.id = $1
    ";

    let new_group_row = conn.query_one(select_sql, &[&new_id]).await.map_err(internal_error)?;

    let new_group = ConfirmationGroup::from(new_group_row);
    Ok((StatusCode::CREATED, Json(new_group)))
}

pub async fn get_group_details(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ConfirmationGroupDetails>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // Step 1: Fetch the main group details (this part is correct)
    let group_sql = "
        SELECT 
            cg.id, cg.module, cg.start_date,
            cg.day_of_the_week::TEXT as day_of_the_week,
            c.full_name as catechist_name
        FROM confirmation_groups cg
        LEFT JOIN catechists c ON cg.catechist_id = c.id
        WHERE cg.id = $1
    ";
    let group_row = conn.query_one(group_sql, &[&id]).await.map_err(internal_error)?;

    // Step 2: Fetch the list of members in this group - THE QUERY IS UPDATED
    let members_sql = "
        SELECT 
            c.id, c.full_name, c.email, c.phone_number, c.creation_date, c.marital_status::TEXT as marital_status,
            c.birth_date, c.address, c.father_name, c.mother_name, c.baptism_church, c.communion_church,
            cg.id as current_group_id,
            cg.module as current_group_module
        FROM confirmands c
        INNER JOIN confirmand_confirmation_groups ccg ON c.id = ccg.confirmand_id
        LEFT JOIN confirmation_groups cg ON ccg.confirmation_group_id = cg.id
        WHERE ccg.confirmation_group_id = $1
        ORDER BY c.full_name
    ";
    let member_rows = conn.query(members_sql, &[&id]).await.map_err(internal_error)?;
    let members: Vec<Confirmand> = member_rows.into_iter().map(Confirmand::from).collect();

    // Step 3: Combine the data into our response model (this part is correct)
    let group_details = ConfirmationGroupDetails {
        id: group_row.get("id"),
        module: group_row.get("module"),
        catechist_name: group_row.get("catechist_name"),
        day_of_the_week: group_row.get("day_of_the_week"),
        start_date: group_row.get("start_date"),
        members,
    };

    Ok(Json(group_details))
}

// --- NEW --- Handler for `POST /api/groups/:id/participants`
pub async fn add_participant_to_group(
    user: AuthenticatedUser,
    State(state): State<AppState>,
    Path(group_id): Path<i32>,
    Json(payload): Json<AddParticipantToGroup>,
) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> { // Return type is now Json<Value>
    let conn = state.get().await.map_err(internal_error)?;

    let sql = "
        INSERT INTO confirmand_confirmation_groups (confirmand_id, confirmation_group_id)
        VALUES ($1, $2)
        ON CONFLICT (confirmand_id, confirmation_group_id) DO NOTHING
    ";

    let result = conn.execute(sql, &[&payload.confirmand_id, &group_id]).await.map_err(internal_error)?;

    if result > 0 {
        // Return a JSON object with a success message
        Ok((StatusCode::CREATED, Json(json!({ "message": "Participant added to group successfully." }))))
    } else {
        // Return a JSON object for the "already exists" case
        Ok((StatusCode::OK, Json(json!({ "message": "Participant was already in this group." }))))
    }
}

pub async fn remove_participant_from_group(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
    Path((group_id, confirmand_id)): Path<(i32, i32)>, // Axum can extract multiple path params into a tuple
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    let sql = "
        DELETE FROM confirmand_confirmation_groups
        WHERE confirmand_id = $1 AND confirmation_group_id = $2
    ";

    conn.execute(sql, &[&confirmand_id, &group_id]).await.map_err(internal_error)?;

    // DELETE is idempotent, so we don't need to check if a row was actually deleted.
    // We just ensure the state is what the user wants (the link doesn't exist).
    Ok(StatusCode::NO_CONTENT)
}

// Handler for `GET /api/sacraments`
pub async fn list_all_sacraments(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
) -> Result<Json<Vec<Sacrament>>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let rows = conn
        .query("SELECT id, name FROM sacraments ORDER BY id", &[])
        .await
        .map_err(internal_error)?;
    let sacraments: Vec<Sacrament> = rows.into_iter().map(Sacrament::from).collect();
    Ok(Json(sacraments))
}

// Handler for `GET /api/confirmands/:id/details`
// MODIFIED: This handler now also fetches the participant's entire group history.
pub async fn get_participant_details(
    user: AuthenticatedUser,
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ConfirmandDetails>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // Step 1: Get the main participant info. THIS QUERY IS NOW CORRECTED.
    let confirmand_sql = "
        SELECT 
            c.id, c.full_name, c.email, c.phone_number, c.creation_date, c.marital_status::TEXT as marital_status,
            c.birth_date, c.address, c.father_name, c.mother_name, c.baptism_church, c.communion_church,
            cg.id as current_group_id,
            cg.module as current_group_module,
            cg.start_date as current_group_start_date -- This was the missing column
        FROM confirmands c
        LEFT JOIN confirmand_confirmation_groups ccg ON c.id = ccg.confirmand_id
        LEFT JOIN confirmation_groups cg ON ccg.confirmation_group_id = cg.id
        WHERE c.id = $1
    ";
    let confirmand_row = conn.query_one(confirmand_sql, &[&id]).await.map_err(internal_error)?;
    let confirmand = Confirmand::from(confirmand_row);

    // Step 2: Get their completed sacraments (this was already correct)
    let sacraments_sql = "
        SELECT s.id, s.name 
        FROM sacraments s
        INNER JOIN confirmand_sacraments cs ON s.id = cs.sacrament_id
        WHERE cs.confirmand_id = $1
        ORDER BY s.id
    ";
    let sacrament_rows = conn.query(sacraments_sql, &[&id]).await.map_err(internal_error)?;
    let sacraments: Vec<Sacrament> = sacrament_rows.into_iter().map(Sacrament::from).collect();

    // Step 3: Get their entire group history (this was already correct)
    let history_sql = "
        SELECT 
            cg.id, 
            cg.module,
            cg.start_date,
            c.full_name as catechist_name
        FROM confirmation_groups cg
        INNER JOIN confirmand_confirmation_groups ccg ON cg.id = ccg.confirmation_group_id
        LEFT JOIN catechists c ON cg.catechist_id = c.id
        WHERE ccg.confirmand_id = $1
        ORDER BY cg.start_date DESC
    ";
    let history_rows = conn.query(history_sql, &[&id]).await.map_err(internal_error)?;
    let group_history: Vec<GroupSummary> = history_rows.into_iter().map(|row| GroupSummary {
        id: row.get("id"),
        module: row.get("module"),
        start_date: row.get("start_date"),
        catechist_name: row.get("catechist_name"),
    }).collect();

    // Step 4: Combine into the final response model (this was already correct)
    let details = ConfirmandDetails {
        confirmand,
        sacraments,
        group_history,
    };
    Ok(Json(details))
}

// Handler for `POST /api/confirmands/:id/sacraments`
pub async fn add_sacrament_to_participant(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
    Path(confirmand_id): Path<i32>,
    Json(payload): Json<UpdateParticipantSacrament>,
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let sql = "
        INSERT INTO confirmand_sacraments (confirmand_id, sacrament_id)
        VALUES ($1, $2) ON CONFLICT DO NOTHING
    ";
    conn.execute(sql, &[&confirmand_id, &payload.sacrament_id]).await.map_err(internal_error)?;
    Ok(StatusCode::CREATED)
}

// Handler for `DELETE /api/confirmands/:confirmandId/sacraments/:sacramentId`
pub async fn remove_sacrament_from_participant(
    user: AuthenticatedUser,  // Ensure only admins can access this endpoint
    State(state): State<AppState>,
    Path((confirmand_id, sacrament_id)): Path<(i32, i16)>,
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let sql = "DELETE FROM confirmand_sacraments WHERE confirmand_id = $1 AND sacrament_id = $2";
    conn.execute(sql, &[&confirmand_id, &sacrament_id]).await.map_err(internal_error)?;
    Ok(StatusCode::NO_CONTENT)
}

// ===================================================================
// CSV Import Handler --- MODIFIED ---
// ===================================================================

pub async fn import_confirmands_from_csv(
    user: AuthenticatedUser,
    State(state): State<AppState>,
    body: String,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    println!("[IMPORT] Received CSV data for import.");

    let mut reader = ReaderBuilder::new()
        .delimiter(b'\t')
        .from_reader(Cursor::new(body));

    let mut imported_emails = Vec::new();
    let mut skipped_count = 0;

    let conn = state.get().await.map_err(internal_error)?;

    for result in reader.records() {
        let record = match result {
            Ok(rec) => rec,
            Err(_) => { skipped_count += 1; continue; }
        };

        let email = record.get(3).unwrap_or_default().trim().to_string();
        if email.is_empty() {
            skipped_count += 1;
            continue;
        }

        let full_name = record.get(1).unwrap_or_default().trim().to_string();
        let birth_date_str = record.get(2).unwrap_or_default().trim();
        let address = record.get(4).unwrap_or_default().trim().to_string();
        let phone_number = record.get(5).unwrap_or_default().trim().to_string();
        let marital_status_str = record.get(6).unwrap_or_default().trim();

        let birth_date = match NaiveDate::parse_from_str(birth_date_str, "%d/%m/%Y") {
            Ok(date) => date,
            Err(_) => { skipped_count += 1; continue; }
        };

        let marital_status = match marital_status_str {
            "Casado/a na Igreja" => MaritalStatus::MarriedChurch,
            _ => MaritalStatus::Single,
        };
        
        let new_participant = CreateConfirmand {
            full_name, birth_date, address, phone_number, email, marital_status,
            father_name: None, mother_name: None, baptism_church: None, communion_church: None,
        };

        // This query now returns the email of the inserted row.
        // It will only return a row if the INSERT was successful (not a conflict).
        let insert_sql = "
            INSERT INTO confirmands (full_name, birth_date, address, phone_number, email, marital_status)
            VALUES ($1, $2, $3, $4, $5, CAST($6 AS VARCHAR)::marital_status_enum)
            ON CONFLICT (email) DO NOTHING
            RETURNING email
        ";
        
        let result_row = conn.query_opt(insert_sql, &[
            &new_participant.full_name, &new_participant.birth_date, &new_participant.address,
            &new_participant.phone_number, &new_participant.email, &new_participant.marital_status.to_string(),
        ]).await.map_err(internal_error)?;
        
        if let Some(row) = result_row {
            let imported_email: String = row.get(0);
            imported_emails.push(imported_email);
        }
    }

    let new_participants_count = imported_emails.len();
    let mut imported_confirmands: Vec<Confirmand> = Vec::new();

    // If we imported any users, fetch their full records to return to the frontend.
    if !imported_emails.is_empty() {
        let select_sql = "
            SELECT 
                c.id, c.full_name, c.email, c.phone_number, c.creation_date, c.marital_status::TEXT as marital_status,
                c.birth_date, c.address, c.father_name, c.mother_name, c.baptism_church, c.communion_church,
                cg.id as current_group_id,
                cg.module as current_group_module,
                cg.start_date as current_group_start_date
            FROM confirmands c
            LEFT JOIN confirmand_confirmation_groups ccg ON c.id = ccg.confirmand_id
            LEFT JOIN confirmation_groups cg ON ccg.confirmation_group_id = cg.id
            WHERE c.email = ANY($1)
        ";
        let rows = conn.query(select_sql, &[&imported_emails]).await.map_err(internal_error)?;
        imported_confirmands = rows.into_iter().map(Confirmand::from).collect();
    }
    
    println!("[IMPORT] Finished. Imported: {}, Skipped: {}", new_participants_count, skipped_count);
    
    Ok(Json(json!({
        "status": "success",
        "new_participants_imported": new_participants_count,
        "rows_skipped": skipped_count,
        "imported_records": imported_confirmands // Send the full records back
    })))
}

pub async fn get_dashboard_stats(
    user: AuthenticatedUser,
    State(state): State<AppState>,
) -> Result<Json<DashboardStats>, (StatusCode, String)> {
    // MODIFIED: The connection is now mutable
    let mut conn = state.get().await.map_err(internal_error)?;

    let transaction = conn.transaction().await.map_err(internal_error)?;

    let p_count_row = transaction.query_one("SELECT COUNT(*) FROM confirmands", &[]).await.map_err(internal_error)?;
    let c_count_row = transaction.query_one("SELECT COUNT(*) FROM catechists WHERE currently_active = TRUE", &[]).await.map_err(internal_error)?;
    let g_count_row = transaction.query_one("SELECT COUNT(*) FROM confirmation_groups WHERE end_date IS NULL", &[]).await.map_err(internal_error)?;
    
    transaction.commit().await.map_err(internal_error)?;

    let stats = DashboardStats {
        participant_count: p_count_row.get(0),
        catechist_count: c_count_row.get(0),
        active_group_count: g_count_row.get(0),
    };

    Ok(Json(stats))
}

pub async fn me_handler(
    user: AuthenticatedUser, // PROTECTED
    State(state): State<AppState>,
) -> Result<Json<User>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let row = conn.query_opt("SELECT id, username FROM users WHERE id = $1", &[&user.id])
        .await.map_err(internal_error)?;
    if let Some(row) = row {
        Ok(Json(User { id: row.get("id"), username: row.get("username") }))
    } else {
        Err((StatusCode::NOT_FOUND, "User not found".to_string()))
    }
}

fn internal_error<E>(err: E) -> (StatusCode, String)
where
    E: std::error::Error,
{
    eprintln!("[ERROR] Internal server error: {}", err);
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}