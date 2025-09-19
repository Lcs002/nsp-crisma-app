// Participant type
export interface Confirmand {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  marital_status: string;
  creation_date: string;
}

// Catechist type
export interface Catechist {
  id: number;
  full_name: string;
  currently_active: boolean;
}

// Confirmation Group type (for the list view)
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

// --- NEW --- Group Details Type --- NEW ---
// This must match the Rust ConfirmationGroupDetails struct
export interface ConfirmationGroupDetails {
  id: number;
  module: number;
  catechist_name: string | null;
  day_of_the_week: string;
  start_date: string;
  members: Confirmand[]; // A list of the participants in this group
}