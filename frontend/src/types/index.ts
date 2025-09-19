// Participant type (for list and detail views) - NOW INCLUDES ALL FIELDS
export interface Confirmand {
  id: number;
  full_name: string;
  birth_date: string; // Will be a "YYYY-MM-DD" string from the DB
  address: string;
  phone_number: string;
  email: string;
  marital_status: string;
  father_name: string | null; // Nullable fields are represented this way
  mother_name: string | null;
  baptism_church: string | null;
  communion_church: string | null;
  creation_date: string; // Full ISO date string
}

// Catechist type (unchanged)
export interface Catechist {
  id: number;
  full_name: string;
  currently_active: boolean;
}

// Confirmation Group type (list view) (unchanged)
export interface ConfirmationGroup {
  id: number;
  module: number;
  catechist_id: number | null;
  catechist_name: string | null;
  day_of_the_week: string;
  group_link: string | null;
  start_date: string;
  end_date: string | null;
}

// Group Details Type (unchanged)
export interface ConfirmationGroupDetails {
  id: number;
  module: number;
  catechist_name: string | null;
  day_of_the_week: string;
  start_date: string;
  members: Confirmand[];
}

// Sacrament Type (unchanged)
export interface Sacrament {
    id: number;
    name: string;
}

// Participant Detail Type - MODIFIED
// It now implicitly has all the fields because it extends the updated Confirmand type
export interface ConfirmandDetails extends Confirmand {
    sacraments: Sacrament[];
}