# Create Regolith

This is an unofficial Project made by me to more easily
create Regolith Projects with neccessary stuff already premade

### How to use

-   run `npm create regolith@latest` in the directory you want to create your regolith project in
-   you can change the pack name in the config.json and description in the package.json

### Features

-   Typescript: Adds Typescript to your Project in 'packs/data/src'
-   esBuild: Adds esBuild support for bundeling and building your scripts faster then with tsc
-   Typesafe-MC (requires @minecraft/server-ui): Adds Proper types to the ModalFormData
-   Texture Generator\*: Adds a generator for your texture files

### Texture Generator\*

Gets all image files (only blocks and items) from your textures/(name)/(project)/(items/blocks)
folder and generates the following files for your:

-   terrain_texture.json
-   item_texture.json
-   texture_set.json
-   flipbook_texture.json (requires the texture name to end with \_anim)

### Flipbook Texture

You can optionally add a json file to animated files
if the img file is named "my_texture_anim.png"
then the json file should be named "my_texture_anim.json"
Here's the format of the file

```json
{
    "ticks_per_frame": "number",
    "frames": "number[]",
    "atlas_index": "number",
    "atlas_tile_variant": "number",
    "blend_frames": "boolean"
}
```