export type Storage = {
    blocks: dataType[];
    items: dataType[];
}

export type dataType = {
    name: string;
    path: string;
    anim: boolean;
    tga: boolean;
}

export type flipbook = {
    flipbook_texture: string;
    atlas_tile: string;
    ticks_per_frame?: number;
    frames?: number[];
    atlas_index?: number;
    atlas_tile_variant?: number;
    blend_frames?: boolean;
}