export type SongDemo = {
	id: string;
	title: string;
	artist: string;
	// in seconds
	duration: number;
	fileUrl: string;
	uploadedAt: Date;
	userId: string;
	genre?: string;
	tags?: string[];
};

export type CreateSongDemoRequest = {
	title: string;
	artist: string;
	duration: number;
	genre?: string;
	tags?: string[];
};

export type UpdateSongDemoRequest = {
	title?: string;
	artist?: string;
	genre?: string;
	tags?: string[];
};

export type SongListDemoResponse = {
	songs: SongDemo[];
	total: number;
	page: number;
	limit: number;
};
