const vkapi = new (require('node-vkapi'))();
const https = require('https');
const fs = require('fs');


let uploaded = 0;
let all = 0;
let offset = 0;
let one_peace = 10;

function prepareAlbums(photo) {
    if (all === 0) {
        all = photo.count;
    }
    photo.items.forEach((p, i) => {
        //получаем название поля с максимально большой фотографией
        //console.log('p', p);
        const keyArr = Object.keys(p)
            .filter(k => /^photo_\d+/.test(k))            
            .map(k => +k.match(/^photo_(\d+)$/)[1]);
        //console.log('keyArr', Math.max.apply(null, keyArr));
        const url = p['photo_' + Math.max.apply(null, keyArr)];
        console.log(offset + i, all,  url);

        let file = fs.createWriteStream('saved/' + (offset + i) + '.jpg');
        let request = https.get(url, function(response) {
            response.pipe(file);
            console.log('close',offset + i + '.jpg', all);
        });

    });

    if (offset + one_peace >= all) {
        return;
    }

    offset = offset + one_peace;

    //getUserPhoto({count: one_peace, sort: '0', offset})

    vkapi.call('photos.get', {count: one_peace, sort: '0', album_id: 'saved', offset})
        .then(prepareAlbums)
        .catch(callPolice);
}

function callPolice(error) {
    console.log('error', error);
}

function getUserPhoto(options) {
    vkapi.call('photos.getUserPhotos', {count: one_peace, sort: '0'})
        .then(prepareAlbums)
        .catch(callPolice);
}

function drawConsole() {
    var lineReader = require('readline').createInterface({
        input: fs.createReadStream('README.md')
    });

    lineReader.on('line', function (line) {
        console.log(line);
    }); 

}

function parseConsole() {
    console.log(process.argv);
}

function main() {
    let config;

    try {
     config = require('./config.js');
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            drawConsole();
        } else {
            console.log('error', e);
        }
        return;
    }

    parseConsole();
    //логинимся пользователем
    try {
        vkapi.authorize(config.credentials);
    } catch (e) {
        console.log('Login failed!', e);
        return;
    }

    //полчаем все его альбомы
    //getUserPhoto({count: one_peace, sort: '0', offset});

    vkapi.call('photos.get', {count: one_peace, sort: '0', album_id: 'saved'})
        .then(prepareAlbums)
        .catch(callPolice);

    console.log('Finished');
}

main();
