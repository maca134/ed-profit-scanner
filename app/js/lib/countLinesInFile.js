var fs = require('fs');
var split = require('split');

module.exports = function countLinesInFile(file, complete) {
    var readError;
    var lineCount = 0;
    fs.createReadStream(file).pipe(split()).on('data', l => {
        lineCount++
    }).on('end', () => {
        if (readError)
            return;
        complete(null, lineCount - 1);
    }).on('error', e => {
        readError = true;
        complete(e);
    });
};