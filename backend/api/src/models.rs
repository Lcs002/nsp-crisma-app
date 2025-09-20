use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use strum::ToString;

// ===================================================================
// Custom ENUM Types
// ===================================================================

#[derive(Serialize, Deserialize, Debug, ToString, Clone, PartialEq)]
#[strum(serialize_all = "PascalCase")]
#[serde(rename_all = "PascalCase")]
pub enum MaritalStatus {
    Single,
    #[strum(to_string = "Married - Church")]
    #[serde(rename = "Married - Church")]
    MarriedChurch,
    #[strum(to_string = "Married - Civil")]
    #[serde(rename = "Married - Civil")]
    MarriedCivil,
    Union,
    Divorced,
    Widowed,
}

#[derive(Serialize, Deserialize, Debug, ToString, Clone, PartialEq)]
#[strum(serialize_all = "PascalCase")]
#[serde(rename_all = "PascalCase")]
pub enum DayOfTheWeek {
    Sunday,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
}

// ===================================================================
// --- NEW --- Group Summary Model --- NEW ---
// ===================================================================

// A lightweight summary of a group for display in lists
#[derive(Serialize, Clone, Debug)]
pub struct GroupSummary {
    pub id: i32,
    pub module: i16,
    pub start_date: NaiveDate, // --- NEW ---
    pub catechist_name: Option<String>,
}
// ===================================================================
// Confirmand Models --- MODIFIED ---
// ===================================================================

// This struct now includes all fields needed for creating and updating a confirmand.
#[derive(Deserialize)]
pub struct CreateConfirmand {
    pub full_name: String,
    pub birth_date: NaiveDate,
    pub address: String,
    pub phone_number: String,
    pub email: String,
    pub marital_status: MaritalStatus,
    pub father_name: Option<String>,
    pub mother_name: Option<String>,
    pub baptism_church: Option<String>,
    pub communion_church: Option<String>,
}

// This struct now represents a full confirmand record, including all optional fields.
#[derive(Serialize, Clone)]
pub struct Confirmand {
    pub id: i32,
    pub full_name: String,
    pub birth_date: NaiveDate,
    pub address: String,
    pub phone_number: String,
    pub email: String,
    pub marital_status: String,
    pub father_name: Option<String>,
    pub mother_name: Option<String>,
    pub baptism_church: Option<String>,
    pub communion_church: Option<String>,
    pub creation_date: DateTime<Utc>,
    pub current_group_id: Option<i32>,
    pub current_group_module: Option<i16>,
}

impl From<Row> for Confirmand {
    fn from(row: Row) -> Self {
        Self {
            id: row.get("id"),
            full_name: row.get("full_name"),
            birth_date: row.get("birth_date"),
            address: row.get("address"),
            phone_number: row.get("phone_number"),
            email: row.get("email"),
            marital_status: row.get("marital_status"),
            father_name: row.get("father_name"),
            mother_name: row.get("mother_name"),
            baptism_church: row.get("baptism_church"),
            communion_church: row.get("communion_church"),
            creation_date: row.get("creation_date"),
            current_group_id: row.get("current_group_id"),
            current_group_module: row.get("current_group_module"),
        }
    }
}

// ===================================================================
// Catechist Models (unchanged)
// ===================================================================

#[derive(Deserialize)]
pub struct CreateCatechist {
    pub full_name: String,
    pub currently_active: bool,
}

#[derive(Serialize, Clone)] 
pub struct Catechist {
    pub id: i32,
    pub full_name: String,
    pub currently_active: bool,
    pub latest_group_id: Option<i32>,
    pub latest_group_module: Option<i16>,
    pub latest_group_start_date: Option<NaiveDate>,
}

impl From<Row> for Catechist {
    fn from(row: Row) -> Self {
        Self {
            id: row.get("id"),
            full_name: row.get("full_name"),
            currently_active: row.get("currently_active"),
            // --- NEW ---
            latest_group_id: row.get("latest_group_id"),
            latest_group_module: row.get("latest_group_module"),
            latest_group_start_date: row.get("latest_group_start_date"),
        }
    }
}

#[derive(Serialize)]
pub struct CatechistDetails {
    #[serde(flatten)]
    pub catechist: Catechist,
    pub group_history: Vec<GroupSummary>,
}

// ===================================================================
// Confirmation Group Models (unchanged)
// ===================================================================

#[derive(Deserialize)]
pub struct CreateConfirmationGroup {
    pub module: i16,
    pub catechist_id: Option<i32>,
    pub day_of_the_week: DayOfTheWeek,
    pub group_link: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
}

#[derive(Serialize)]
pub struct ConfirmationGroup {
    pub id: i32,
    pub module: i16,
    pub catechist_id: Option<i32>,
    pub catechist_name: Option<String>,
    pub day_of_the_week: String,
    pub group_link: Option<String>,
    pub start_date: NaiveDate,
    pub end_date: Option<NaiveDate>,
}

impl From<Row> for ConfirmationGroup {
    fn from(row: Row) -> Self {
        Self {
            id: row.get("id"),
            module: row.get("module"),
            catechist_id: row.get("catechist_id"),
            catechist_name: row.get("catechist_name"),
            day_of_the_week: row.get("day_of_the_week"),
            group_link: row.get("group_link"),
            start_date: row.get("start_date"),
            end_date: row.get("end_date"),
        }
    }
}

#[derive(Deserialize)]
pub struct AddParticipantToGroup {
    pub confirmand_id: i32,
}

#[derive(Serialize)]
pub struct ConfirmationGroupDetails {
    pub id: i32,
    pub module: i16,
    pub catechist_name: Option<String>,
    pub day_of_the_week: String,
    pub start_date: NaiveDate,
    pub members: Vec<Confirmand>,
}

// ===================================================================
// Sacrament & Participant Detail Models (unchanged)
// ===================================================================

#[derive(Serialize, Clone, Debug)]
pub struct Sacrament {
    pub id: i16,
    pub name: String,
}

impl From<Row> for Sacrament {
    fn from(row: Row) -> Self {
        Self {
            id: row.get("id"),
            name: row.get("name"),
        }
    }
}

#[derive(Deserialize)]
pub struct UpdateParticipantSacrament {
    pub sacrament_id: i16,
}

#[derive(Serialize)]
pub struct ConfirmandDetails {
    #[serde(flatten)]
    pub confirmand: Confirmand,
    pub sacraments: Vec<Sacrament>,
    pub group_history: Vec<GroupSummary>,
}