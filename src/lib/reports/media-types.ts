export type MediaAssetStatus = "uploading" | "ready" | "published" | "failed";

export type MediaRosterChild = {
  childId: string;
  registrationId: string;
  firstName: string;
  lastName: string;
  photoSignedUrl: string | null;
  reportChildId: string | null;
};

export type MediaAssetItem = {
  id: string;
  storagePath: string;
  signedUrl: string | null;
  mimeType: string;
  fileSize: number;
  caption: string | null;
  status: MediaAssetStatus;
  taggedChildIds: string[];
  publishedAt: string | null;
  createdAt: string;
};

export type MediaWorkspace = {
  reportId: string;
  programId: string;
  programName: string;
  reportDate: string;
  reportStatus: string;
  children: MediaRosterChild[];
  assets: MediaAssetItem[];
  untaggedCount: number;
  readyToPublishCount: number;
};
