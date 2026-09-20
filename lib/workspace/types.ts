export type WorkspaceView = "canvas" | "records";
export type ObjectStatus = "inbox" | "active" | "waiting" | "done";

export type WorkspaceSpace = {
  id: string;
  name: string;
  view: WorkspaceView;
  createdAt: number;
};

export type CustomProperty = {
  id: string;
  name: string;
  value: string;
};

export type WorkspaceObject = {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  status: ObjectStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  startDate: string;
  endDate: string;
  reminder: string;
  recurrence: string;
  person: string;
  tags: string[];
  properties: CustomProperty[];
  createdAt: number;
  updatedAt: number;
};

export type WorkspaceLink = {
  id: string;
  spaceId: string;
  fromId: string;
  toId: string;
  label: string;
};

export type WorkspaceState = {
  version: 1;
  spaces: WorkspaceSpace[];
  objects: WorkspaceObject[];
  links: WorkspaceLink[];
  activeSpaceId: string;
};
