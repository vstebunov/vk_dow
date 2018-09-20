const vkapi = new (require('node-vkapi'))();
const https = require('https');
const fs = require('fs');


let uploaded = 0;
let all = 0;
let offset = 0;
let one_peace = 10;
let dir_name = 'tagged';
let album_id = -666;
let is_tagged = false;

function prepareAlbums(photo) {
    if (all === 0) {
        all = photo.count;
    }
    
    if (!fs.existsSync(dir_name)){
        fs.mkdirSync(dir_name);
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

        let file = fs.createWriteStream(dir_name + '/' + (offset + i) + '.jpg');
        let request = https.get(url, function(response) {
            response.pipe(file);
            console.log('close',offset + i + '.jpg', all);
        });

    });

    if (offset + one_peace >= all) {
        return;
    }

    offset = offset + one_peace;

    if (is_tagged) {
        getUserPhoto({count: one_peace, sort: '0', offset})
    } else { 
        getPhotoByAlbum({count: one_peace, sort: '0', album_id, offset}); 
    }
}

function callPolice(error) {
    console.log('error', error);
}

function getUserPhoto(options) {
    vkapi.call('photos.getUserPhotos', options)
        .then(prepareAlbums)
        .catch(callPolice);
}

function getPhotoByAlbum(options) {
    //vkapi.call('photos.get', {count: one_peace, sort: '0', album_id: album_id, offset})
    vkapi.call('photos.get', options)
        .then(prepareAlbums)
        .catch(callPolice);
}

function getAllAlbums(options) {
    vkapi.call('photos.getAlbums', {need_system: '1'} )
        .then(function(albums) {
            console.log(albums.count);
            var ids = new Array(albums.count);
            var title = new Array(albums.count);
            var i = 0;
            albums.items.forEach(function(album) {
                console.log(i, album.id, album.title, album.description);
                ids[i] = album.id;
                title[i] = album.title;
                i = i + 1;
            })

            console.log('M', 'tagged by me');
            console.log('A', 'all albums');

            var stdin = process.stdin.resume();
            let keyboardListener = function(index) {
                stdin.removeListener('data', keyboardListener);
                stdin.pause();

                offset = 0;

                if (ids[ parseInt(index) ]) {
                    album_id = ids[ parseInt(index) ];
                    dir_name = title[ parseInt(index) ];
                    is_tagged = false;

                    getPhotoByAlbum({count: one_peace, sort: '0', album_id: album_id});
                }

                if (index.toString().trim() === 'M') {
                    dir_name = 'tagged';
                    is_tagged = true;
                    getUserPhoto({count: one_peace, sort: '0', offset});
                }

                if (index.toString().trim() === 'A') {
                    offset = 0;
                    //getPhotoByAlbum({count: one_peace, sort: '0', album_id: album_id});
                }
            }
            stdin.addListener('data', keyboardListener);
        })
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
        vkapi.authorize(config.credentials)
            .then(function(x) { 
                //получаем названия альбомов
                getAllAlbums();
                console.log('Finished');
            })
            .catch(function(authorizeError) { 
                console.log(authorizeError.message) 
                console.log('authorizeError', authorizeError.name) 
                console.log(authorizeError.type) 
            });
    } catch (e) {
        console.log('Login failed!', e);
        return;
    }

}

main();
