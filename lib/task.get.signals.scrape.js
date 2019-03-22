const {	merge } = require('lodash')
const {	resolve } = require('path')
const {	spawn } = require('child_process')
module.exports = function(ticker){
    return function(cb){

        let scraperData = ''
        let errData = ''
        const scraper = spawn(
            'casperjs', 
            [
                'test', 
                '--verbose', 
                '--ignore-ssl-errors=true', 
                '--load-images=true', 
                '--web-security=no',
                resolve(__dirname, './casper.scrape.technicals.js')
            ],{
            env: merge({}, process.env, {
                ABORT_SECONDS: process.env.ABORT_SECONDS,
                TICKER: ticker
            })
        })

        scraper.stdout.setEncoding('utf8')

        scraper.on('error', function (err) {
            errData = err
            console.error(`Failed to spawn child process! ${err}`)
        })

        scraper.stdout.on('data', function (data) {
            scraperData += data
        })

        scraper.stderr.on('data', function (data) {
            errData = data
            console.error(`stderr: ${data}`)
        })

        scraper.on('close', function (code) {
            cb(errData, scraperData)
        })
    }
}