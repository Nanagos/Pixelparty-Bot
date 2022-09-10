//  My own chat parser, that I used in other projects.
//  But I recently found out, that there is a dedicaded library for this...
const lang = require("./data/lang.json");

function convertJson(json) {
    let res;
  
    if(json.json) {
        res = readPartList(json.json, "", []);
    } else {
        return null;
    }

    let { message } = res;
    
    message = removeColorCodes(message);

    return message;
}

function readPartList(list, message, colors) {
    if(!(list instanceof Array)) list = [list];
        
    list.forEach(part => {
        if(part.color) {
            colors.push(part.color);
        }

        if(part.text) {
            message += part.text;
        } else if(part.translate) {
            let translated = lang[part.translate];
            if(part.translate.match(/entity\.([^.]+)\.name/g)) {
                translated = lang[`entity.minecraft.${part.translate.split(".")[1].toLowerCase()}`];
            }
            if(!translated) return;
            
            if(part.with) {
                let counter = 1;
                part.with.forEach(wp => {
                let res = readPartList(wp, "", []);
                
                if(translated.includes("%s"))
                    translated = translated.replace("%s", res.message);
                else if(translated.includes(`%${counter}$s`))
                    translated = translated.replace(`%${counter}$s`, res.message);
                
                    colors = colors.concat(res.colors);
                    counter++;
                });
            }
            message += translated;
        }

        if(part.extra) {
            let res = readPartList(part.extra, message, colors);
            message = res.message;
            colors = res.colors;
            return;
        }
    });

    return {
        message,
        colors
    }
}

function removeColorCodes(text) {
    let new_text = "";

    for(let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        if(char === '§') {
        i++;
        continue;
        }
        new_text += char;
    }

    return new_text;
}

module.exports = {
    convertJson
}