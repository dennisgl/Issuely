"use strict";

$(document).on('ready', function(){
        var ownerName, repoName;

        $('#headLine').text(repoName);
        var words = function(sentences){
         
          var sWords = sentences.join(' ').toLowerCase().trim().replace(/[,;.\#\%\@\?\\\!\[\]\`\'\(\)\<\>\{\}\:\+\-\*\/\=\"\$]/g,' ').split(/[\s\/]+/g).sort();
          var iWordsCount = sWords.length; // count w/ duplicates
         
          // array of words to ignore
          var ignore = ['and','the','to','a','of','for','as','i','with','it','is','on','that','this','can','in','be','has','if'];
          ignore = (function(){
            var o = {}; // object prop checking > in array checking
            for ( var i=0; i<60000; i++) {
                o[i] = true;
            }
            var iCount = ignore.length;
            for (var i=0;i<iCount;i++){
              o[ignore[i]] = true;
            }
            return o;
          }());
         
          var counts = {}; // object for math
          for (var i=0; i<iWordsCount; i++) {
            var sWord = sWords[i];
            if (!ignore[sWord]) {
              counts[sWord] = counts[sWord] || 0;
              counts[sWord]++;
            }
          }
         
          var arr = []; // an array of objects to return
          for (sWord in counts) {
            arr.push({
              label: sWord,
              value: counts[sWord]
            });
          }
         
          // sort array by descending frequency | http://stackoverflow.com/a/8837505
          return arr.sort(function(a,b){
            return (a.value > b.value) ? -1 : ((a.value < b.value) ? 1 : 0);
          });
        };
        var _data = {key:repoName, values: []};
        var chart;
        nv.addGraph(function() {
          chart = nv.models.discreteBarChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .staggerLabels(true)
            .tooltips(false)
            .showValues(true)

          chart.yAxis
                .tickFormat(d3.format('.0f'));

          d3.select('#chart svg')
            .datum(_data)
            .transition().duration(500)
            .call(chart)
            ;

          nv.utils.windowResize(chart.update);

          return chart;
        });

        var render = function(resultData) {
            var freqResult = words(_.pluck(resultData,'body'));
            freqResult = _.filter(freqResult, function(item){
                return item.value>=5 && !_.contains(blackList, item.label);
            });freqResult = freqResult.slice(0,20);
            // Array.prototype.splice.apply(_data.values,freqResult);
            _data.values = freqResult;

            d3.select('#chart svg')
            .datum([_data])
            .transition().duration(500)
            .call(chart)
            ;


            // console.log('ch',chart.update);
            chart.update();

        }
        var resultData=[];
        var fetchDone = false;
        var pageNum = 1;
        var fetch = function() {
            $.getJSON('https://api.github.com/repos/'+ownerName+'/'+repoName+'/issues',
            {
                client_id:'5e69207e53e937646e91',
                client_secret: '6dba8bee25c46db058976ce2e83b83c8a375ea28',
                page:pageNum++,
                per_page:100
            },function(data){
                if ( data.length === 0 ) {
                    fetchDone = true;
                    return ;
                }
                resultData = resultData.concat(data);
                render(resultData);
                console.log('yeap');
            }).fail(function(){fetchDone=true;});
            if (!fetchDone) {
                setTimeout(fetch,1000);
            }
        };
        
        $('#fetchBtn').click(function(){
            ownerName = $('#ownerInput').val();
            $('#ownerInput').val('');
            repoName = $('#repoInput').val();
            $('#repoInput').val('');

            blackList.push(ownerName);
            blackList.push(repoName);
            
            $('#title').text(repoName);
            fetch();
        });

        window._data = _data;
});