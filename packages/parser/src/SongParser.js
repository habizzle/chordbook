import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import {transposeLine} from "./Transposer.js";

export const parse = (path, key) => {
    return findYamlSongDocs(path)
        .map((filePath) => bookify(filePath, key));
};

const findYamlSongDocs = (directory) => {
    return fs.readdirSync(directory, {withFileTypes: true})
        .filter((it) => it.isFile())
        .map((it) => it.name)
        .filter((it) => it.endsWith(".yml"))
        .map((it) => path.join(directory, it));
}

const bookify = (filePath, key) => ({
    id: path.basename(filePath),
    title: formatTitle(filePath),
    songs: parseYamlSongDocs(filePath).map((songDoc) => songify(songDoc, key))
});

const formatTitle = (filePath) => path.basename(filePath)
    .replace(/(.private)?.yml$/, '')
    .replace('-', ' ');

const parseYamlSongDocs = (filePath) => {
    const file = fs.readFileSync(filePath, 'utf8');
    const docs = YAML.parseAllDocuments(file);
    console.log(`Finished parsing ${docs.length} songs from ${filePath}`);
    return docs;
}

const songify = (songDoc, key) => {
    let verseCounter = 1;
    const docObj = songDoc.toJS();

    const blockify = (blockDoc) => {
        const refrain = blockDoc.tag === '!Ref';
        const name = !refrain
            ? blockDoc.tag?.slice(1) ?? `V${verseCounter++}`
            : 'Ref';
        const lines = linify(blockDoc.value.trimEnd());
        return {
            refrain: refrain,
            name: name,
            lines: lines
        };
    };

    const linify = (block) => block.split("\n").map(line => {
        const chord = line.indexOf("  ") >= 0 // either chords are separated by more than 1 whitespace
            || line.indexOf(" ") < 0; // or line contains just 1 chord - it is assumed a line never contains of just one word
        if (chord) {
            if (key) {
                line = transposeLine(line, docObj.key, key);
            }
        }
        return {
            type: chord ? 'chord' : 'text',
            content: line
        }
    });

    const blocks = songDoc.contents.get("song").items.map(blockDoc => blockify(blockDoc));
    return {
        title: docObj.title,
        author: docObj.author,
        blocks: blocks,
    };
};
