var fs = require('fs'),
    xml2js = require('xml2js');
    // child  = require('child_process'); 
var parser = new xml2js.Parser();
var Bluebird = require('bluebird')
const glob = require('glob');


if( process.env.NODE_ENV != "test")
{
 
    var files=[];
    files=glob.sync('../TestReports/**/*.xml');
    // console.log(files);
    var count=0;

    for (let file of files)
    {
        findFlaky(file,count,files.length-1);
        count++;
    }
}

var stats = {}

async function findFlaky(testReport,i,n)
{
    var contents = fs.readFileSync(testReport);
    let xml2json = await Bluebird.fromCallback(cb => parser.parseString(contents, cb));
    var tests = readResults(xml2json);

    for (let test of tests)
    {
        if (!stats.hasOwnProperty(test.name))
        {
            stats[test.name]={passed: 0,failed: 0, timetaken: 0, count: 0};
        }
        if (test.status=="passed")
            stats[test.name].passed++;
        if (test.status=="failed")
            stats[test.name].failed++;

        stats[test.name].count++;

        stats[test.name].timetaken = stats[test.name].timetaken + parseFloat(test.time);
    }

    if (i == n)
        {
            giveAnalysis();
        }
}

async function giveAnalysis(){

    var sortSet = [];
    for( var item in stats)
    {
        
        sortSet.push({
        name:   item, 
        Avgtime:   stats[item].timetaken/stats[item].count, 
        failed: stats[item].failed,
        count:  stats[item].count
        });
    }  

    sortSet.sort((a,b) =>(a.Avgtime > b.Avgtime ? -1 : 1)); 

    sortSet.sort((a,b) => (a.failed > b.failed ? -1: 1));

    console.log(sortSet);
}



function readResults(result)
{
    var tests = [];
    for( var i = 0; i < result.testsuite['$'].tests; i++ )
    {
        var testcase = result.testsuite.testcase[i];

        tests.push({
        name:   testcase['$'].name, 
        time:   testcase['$'].time, 
        status: testcase.hasOwnProperty('failure') ? "failed": "passed"
        });
    }  
tests.sort(function(a, b) { 
    return a.time - b.time;
}) 

tests.sort(function (a,b){
    if (a.status < b.status)
    return -1;
  if (a.status > b.status)
    return 1;
  return 0;   
})

return tests;
}

module.exports.findFlaky = findFlaky;