use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use tokio_postgres::Row;
use strum::ToString;

// (All existing Enums and Confirmand/Catechist models are unchanged)
// ...

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
// Confirmand Models
// ===================================================================

#[derive(Deserialize)]
pub struct CreateConfirmand {
    pub full_name: String,
    pub email: String,
    pub phone_number: String,
    pub birth_date: NaiveDate,
    pub address: String,
    pub marital_status: MaritalStatus,
}

#[derive(Serialize, Clone)] // --- Added Clone for use in the detail view
pub struct Confirmand {
    pub id: i32,
    pub full_name: String,
    pub email: String,
    pub phone_number: String,
    pub marital_status: String,
    pub creation_date: DateTime<Utc>,
}

impl From<Row> for Confirmand {
    fn from(row: Row) -> Self {
        Self {
            id: row.get("id"),
            full_name: row.get("full_name"),
            email: row.get("email"),
            phone_number: row.get("phone_number"),
            marital_status: row.get("marital_status"),
            creation_date: row.get("creation_date"),
        }
    }
}

// ===================================================================
// Catechist Models
// ===================================================================

#[derive(Deserialize)]
pub struct CreateCatechist {
    pub full_name: String,
    pub currently_active: bool,
}

#[derive(Serialize)]
pub struct Catechist {
    pub id: i32,
    pub full_name: String,
    pub currently_active: bool,
}

impl From<Row> for Catechist {
    fn from(row: Row) -> Self {
        Self {
            id: row.get("id"),
            full_name: row.get("full_name"),
            currently_active: row.get("currently_active"),
        }
    }
}

// ===================================================================
// Confirmation Group Models
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

// --- NEW --- Models for the Group Detail View --- NEW ---

// Represents the payload for adding a participant to a group
#[derive(Deserialize)]
pub struct AddParticipantToGroup {
    pub confirmand_id: i32,
}

// Represents the full details of a group, including its members
#[derive(Serialize)]
pub struct ConfirmationGroupDetails {
    pub id: i32,
    pub module: i16,
    pub catechist_name: Option<String>,
    pub day_of_the_week: String,
    pub start_date: NaiveDate,
    pub members: Vec<Confirmand>, // A list of participants in the group
}