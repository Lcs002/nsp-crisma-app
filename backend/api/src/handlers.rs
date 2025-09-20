use axum::{extract::{Path, State}, http::StatusCode, Json};
use crate::{models::{GroupSummary, Confirmand, CreateConfirmand, Catechist, CreateCatechist, CatechistDetails, ConfirmationGroup, CreateConfirmationGroup, AddParticipantToGroup, ConfirmationGroupDetails, Sacrament, ConfirmandDetails, UpdateParticipantSacrament}, AppState};

// MODIFIED: The SELECT query now LEFT JOINs to find the current group for each participant.
pub async fn list_confirmands(
    State(state): State<AppState>,
) -> Result<Json<Vec<Confirmand>>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let sql = "
        SELECT 
            c.id, c.full_name, c.email, c.phone_number, c.creation_date, c.marital_status::TEXT as marital_status,
            c.birth_date, c.address, c.father_name, c.mother_name, c.baptism_church, c.communion_church,
            cg.id as current_group_id,
            cg.module as current_group_module
        FROM confirmands c
        LEFT JOIN confirmand_confirmation_groups ccg ON c.id = ccg.confirmand_id
        LEFT JOIN confirmation_groups cg ON ccg.confirmation_group_id = cg.id
        ORDER BY c.full_name
    ";
    // NOTE: This assumes a participant is only in one group at a time. If they can be in multiple,
    // this query would need to be more complex (e.g., using DISTINCT ON or filtering for an "active" group).
    // For now, this works for the "one group at a time" rule.

    let rows = conn.query(sql, &[]).await.map_err(internal_error)?;
    let confirmands: Vec<Confirmand> = rows.into_iter().map(Confirmand::from).collect();
    Ok(Json(confirmands))
}

// MODIFICATION: The INSERT and RETURNING statements now include all columns.
pub async fn create_confirmand(
    State(state): State<AppState>,
    Json(payload): Json<CreateConfirmand>,
) -> Result<(StatusCode, Json<Confirmand>), (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let row = conn
        .query_one(
            "INSERT INTO confirmands (
                full_name, birth_date, address, phone_number, email, marital_status, 
                father_name, mother_name, baptism_church, communion_church
             ) 
             VALUES ($1, $2, $3, $4, $5, CAST($6 AS VARCHAR)::marital_status_enum, $7, $8, $9, $10) 
             RETURNING 
                id, full_name, email, phone_number, creation_date, marital_status::TEXT as marital_status,
                birth_date, address, father_name, mother_name, baptism_church, communion_church
            ",
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
    let new_confirmand = Confirmand::from(row);
    Ok((StatusCode::CREATED, Json(new_confirmand)))
}

pub async fn update_confirmand(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateConfirmand>,
) -> Result<Json<Confirmand>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let row = conn
        .query_one(
            "UPDATE confirmands 
             SET 
                full_name = $1, birth_date = $2, address = $3, phone_number = $4, email = $5, 
                marital_status = CAST($6 AS VARCHAR)::marital_status_enum,
                father_name = $7, mother_name = $8, baptism_church = $9, communion_church = $10
             WHERE id = $11 
             RETURNING 
                id, full_name, email, phone_number, creation_date, marital_status::TEXT as marital_status,
                birth_date, address, father_name, mother_name, baptism_church, communion_church
            ",
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
                &id,
            ],
        )
        .await
        .map_err(internal_error)?;
    let updated_confirmand = Confirmand::from(row);
    Ok(Json(updated_confirmand))
}

pub async fn delete_confirmand(
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
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<CatechistDetails>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // Step 1: Get the main catechist info (using the same advanced query as the list)
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
    let history_sql = "
        SELECT 
            cg.id, cg.module, c.full_name as catechist_name
        FROM confirmation_groups cg
        LEFT JOIN catechists c ON cg.catechist_id = c.id
        WHERE cg.catechist_id = $1
        ORDER BY cg.start_date DESC
    ";
    let history_rows = conn.query(history_sql, &[&id]).await.map_err(internal_error)?;
    let group_history: Vec<GroupSummary> = history_rows.into_iter().map(|row| GroupSummary {
        id: row.get("id"),
        module: row.get("module"),
        catechist_name: row.get("catechist_name"),
    }).collect();

    // Step 3: Combine into the final response model
    let details = CatechistDetails {
        catechist,
        group_history,
    };
    Ok(Json(details))
}


// Handler for `POST /api/catechists`
pub async fn create_catechist(
    State(state): State<AppState>,
    Json(payload): Json<CreateCatechist>,
) -> Result<(StatusCode, Json<Catechist>), (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let row = conn
        .query_one(
            "INSERT INTO catechists (full_name, currently_active) VALUES ($1, $2) RETURNING *",
            &[&payload.full_name, &payload.currently_active],
        )
        .await
        .map_err(internal_error)?;
    let new_catechist = Catechist::from(row);
    Ok((StatusCode::CREATED, Json(new_catechist)))
}

// Handler for `GET /api/groups`
pub async fn list_groups(
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
    State(state): State<AppState>,
    Path(group_id): Path<i32>,
    Json(payload): Json<AddParticipantToGroup>,
) -> Result<(StatusCode, String), (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    let sql = "
        INSERT INTO confirmand_confirmation_groups (confirmand_id, confirmation_group_id)
        VALUES ($1, $2)
        ON CONFLICT (confirmand_id, confirmation_group_id) DO NOTHING
    "; // ON CONFLICT prevents crashes if the user is already in the group

    let result = conn.execute(sql, &[&payload.confirmand_id, &group_id]).await.map_err(internal_error)?;

    if result > 0 {
        // We successfully added the participant
        Ok((StatusCode::CREATED, "Participant added to group.".to_string()))
    } else {
        // The participant was already in the group, which is not an error
        Ok((StatusCode::OK, "Participant already in group.".to_string()))
    }
}

pub async fn remove_participant_from_group(
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
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<ConfirmandDetails>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // Step 1: Get the main participant info (including current group from the same JOIN as list_confirmands)
    let confirmand_sql = "
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
    let confirmand_row = conn.query_one(confirmand_sql, &[&id]).await.map_err(internal_error)?;
    let confirmand = Confirmand::from(confirmand_row);

    // Step 2: Get their completed sacraments (unchanged)
    let sacraments_sql = "
        SELECT s.id, s.name 
        FROM sacraments s
        INNER JOIN confirmand_sacraments cs ON s.id = cs.sacrament_id
        WHERE cs.confirmand_id = $1
        ORDER BY s.id
    ";
    let sacrament_rows = conn.query(sacraments_sql, &[&id]).await.map_err(internal_error)?;
    let sacraments: Vec<Sacrament> = sacrament_rows.into_iter().map(Sacrament::from).collect();

    // --- NEW --- Step 3: Get their entire group history --- NEW ---
    let history_sql = "
        SELECT 
            cg.id, 
            cg.module,
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
        catechist_name: row.get("catechist_name"),
    }).collect();

    // Step 4: Combine into the final response model
    let details = ConfirmandDetails {
        confirmand,
        sacraments,
        group_history,
    };
    Ok(Json(details))
}

// Handler for `POST /api/confirmands/:id/sacraments`
pub async fn add_sacrament_to_participant(
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
    State(state): State<AppState>,
    Path((confirmand_id, sacrament_id)): Path<(i32, i16)>,
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let sql = "DELETE FROM confirmand_sacraments WHERE confirmand_id = $1 AND sacrament_id = $2";
    conn.execute(sql, &[&confirmand_id, &sacrament_id]).await.map_err(internal_error)?;
    Ok(StatusCode::NO_CONTENT)
}

fn internal_error<E>(err: E) -> (StatusCode, String)
where
    E: std::error::Error,
{
    eprintln!("[ERROR] Internal server error: {}", err);
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}