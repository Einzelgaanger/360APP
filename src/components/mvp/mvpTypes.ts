export type MvpRoleId =
  | 'team_member'
  | 'line_manager'
  | 'peer_reviewer'
  | 'general_manager'
  | 'people_ops'
  | 'admin';

export type MvpNavItem = {
  key: string;
  label: string;
};

export type MvpRoleMeta = {
  id: MvpRoleId;
  tabLabel: string;
  shortLabel: string;
  personaName: string;
  personaTitle: string;
  personaUnit: string;
  blurb: string;
  nav: MvpNavItem[];
};
