import {mkdir, stat} from "fs/promises";

export async function ensureDirectoryCreated(path: string): Promise<void> {
    try {
        await stat(`${path}/`)
    }catch(e) {
        await mkdir(`${path}/`, {recursive: true})
    }
}
