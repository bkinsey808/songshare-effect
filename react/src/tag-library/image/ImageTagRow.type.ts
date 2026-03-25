import type { ImagePublic } from "@/react/image/image-types";

export type ImageTagRow = {
	image_id: string;
	image_public: ImagePublic | null;
};
