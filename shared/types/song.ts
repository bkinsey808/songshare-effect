export interface Song {
	id: string;
	title: string;
	artist: string;
	duration: number; // in seconds
	fileUrl: string;
	uploadedAt: Date;
	userId: string;
	genre?: string;
	tags?: string[];
}

export interface CreateSongRequest {
	title: string;
	artist: string;
	duration: number;
	genre?: string;
	tags?: string[];
}

export interface UpdateSongRequest {
	title?: string;
	artist?: string;
	genre?: string;
	tags?: string[];
}

export interface SongListResponse {
	songs: Song[];
	total: number;
	page: number;
	limit: number;
}
