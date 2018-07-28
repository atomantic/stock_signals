function load(){
    var url = 'https://tradingviewrunner-zonsrjindr.now.sh/data';
    var response = UrlFetchApp.fetch(url, {
        'method': 'get',
        'muteHttpExceptions': true
    });
    var responseJson = JSON.parse(response.getContentText());
    console.log(responseJson)
}