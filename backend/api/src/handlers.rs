use axum::{extract::{Path, State}, http::StatusCode, Json};
use crate::{models::{Confirmand, CreateConfirmand, Catechist, CreateCatechist, ConfirmationGroup, CreateConfirmationGroup, AddParticipantToGroup, ConfirmationGroupDetails}, AppState};

pub async fn list_confirmands(
    State(state): State<AppState>,
) -> Result<Json<Vec<Confirmand>>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    let rows = conn
        .query("SELECT id, full_name, email, phone_number, creation_date, marital_status::TEXT as marital_status FROM confirmands ORDER BY full_name", &[])
        .await
        .map_err(internal_error)?;

    let confirmands: Vec<Confirmand> = rows.into_iter().map(Confirmand::from).collect();
    Ok(Json(confirmands))
}

pub async fn create_confirmand(
    State(state): State<AppState>,
    Json(payload): Json<CreateConfirmand>,
) -> Result<(StatusCode, Json<Confirmand>), (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    
    let row = conn
        .query_one(
            "INSERT INTO confirmands (full_name, email, phone_number, birth_date, address, marital_status) 
             VALUES ($1, $2, $3, $4, $5, CAST($6 AS VARCHAR)::marital_status_enum) 
             RETURNING id, full_name, email, phone_number, creation_date, marital_status::TEXT as marital_status",
            &[
                &payload.full_name,
                &payload.email,
                &payload.phone_number,
                &payload.birth_date,
                &payload.address,
                &payload.marital_status.to_string(),
            ],
        )
        .await
        .map_err(internal_error)?;

    let new_confirmand = Confirmand::from(row);
    Ok((StatusCode::CREATED, Json(new_confirmand)))
}

pub async fn delete_confirmand(
    State(state): State<AppState>,
    Path(id): Path<i32>, // Axum extracts the `:id` from the path into this variable
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    let result = conn
        .execute("DELETE FROM confirmands WHERE id = $1", &[&id])
        .await
        .map_err(internal_error)?;

    // The `execute` method returns the number of rows affected.
    // If it's 0, it means no participant with that ID was found.
    if result == 0 {
        return Err((StatusCode::NOT_FOUND, format!("Participant with ID {} not found", id)));
    }

    // If successful, return a 204 No Content status code, which is standard for DELETE.
    Ok(StatusCode::NO_CONTENT)
}

pub async fn update_confirmand(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<CreateConfirmand>, // The updated data
) -> Result<Json<Confirmand>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;

    // The UPDATE query sets each field based on the payload.
    // We use RETURNING to get the updated record back in one go.
    let row = conn
        .query_one(
            "UPDATE confirmands 
             SET full_name = $1, email = $2, phone_number = $3, birth_date = $4, address = $5, marital_status = CAST($6 AS VARCHAR)::marital_status_enum 
             WHERE id = $7 
             RETURNING id, full_name, email, phone_number, creation_date, marital_status::TEXT as marital_status",
            &[
                &payload.full_name,
                &payload.email,
                &payload.phone_number,
                &payload.birth_date,
                &payload.address,
                &payload.marital_status.to_string(),
                &id,
            ],
        )
        .await
        .map_err(internal_error)?;
    
    // Convert the returned row into our Confirmand struct
    let updated_confirmand = Confirmand::from(row);

    Ok(Json(updated_confirmand))
}

// Handler for `GET /api/catechists`
pub async fn list_catechists(
    State(state): State<AppState>,
) -> Result<Json<Vec<Catechist>>, (StatusCode, String)> {
    let conn = state.get().await.map_err(internal_error)?;
    let rows = conn
        .query("SELECT id, full_name, currently_active FROM catechists ORDER BY full_name", &[])
        .await
        .map_err(internal_error)?;
    let catechists: Vec<Catechist> = rows.into_iter().map(Catechist::from).collect();
    Ok(Json(catechists))
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

    // Step 1: Fetch the main group details
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

    // Step 2: Fetch the list of members in this group
    let members_sql = "
        SELECT 
            c.id, c.full_name, c.email, c.phone_number, c.creation_date, 
            c.marital_status::TEXT as marital_status
        FROM confirmands c
        INNER JOIN confirmand_confirmation_groups ccg ON c.id = ccg.confirmand_id
        WHERE ccg.confirmation_group_id = $1
        ORDER BY c.full_name
    ";
    let member_rows = conn.query(members_sql, &[&id]).await.map_err(internal_error)?;
    let members: Vec<Confirmand> = member_rows.into_iter().map(Confirmand::from).collect();

    // Step 3: Combine the data into our response model
    let group_details = ConfirmationGroupDetails {
        id: group_row.get("id"),
        module: group_row.get("module"),
        catechist_name: group_row.get("catechist_name"),
        day_of_the_week: group_row.get("day_of_the_week"),
        start_date: group_row.get("start_date"),
        members, // Add the list of members here
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

fn internal_error<E>(err: E) -> (StatusCode, String)
where
    E: std::error::Error,
{
    eprintln!("[ERROR] Internal server error: {}", err);
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}