// --- NEW --- Group Summary Type --- NEW ---
export interface GroupSummary {
  id: number;
  module: number;
  start_date: string; // "YYYY-MM-DD"
  catechist_name: string | null;
}

// Participant type - NOW INCLUDES CURRENT GROUP INFO
export interface Confirmand {
  id: number;
  full_name: string;
  birth_date: string;
  address: string;
  phone_number: string;
  email: string;
  marital_status: string;
  father_name: string | null;
  mother_name: string | null;
  baptism_church: string | null;
  communion_church: string | null;
  creation_date: string;
  // --- NEW ---
  current_group_id: number | null;
  current_group_module: number | null;
  current_group_start_date: string | null;
}

// Catechist type (unchanged)
export interface Catechist {
  id: number;
  full_name: string;
  currently_active: boolean;
  latest_group_id: number | null;
  latest_group_module: number | null;
  latest_group_start_date: string | null; // This will be a "YYYY-MM-DD" string
}

export interface CatechistDetails extends Catechist {
  group_history: GroupSummary[];
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

// Participant Detail Type - NOW INCLUDES GROUP HISTORY
export interface ConfirmandDetails extends Confirmand {
    sacraments: Sacrament[];
    group_history: GroupSummary[]; // --- NEW ---
}