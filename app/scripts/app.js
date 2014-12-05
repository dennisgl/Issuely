"use strict";

$(document).on('ready', function(){
        var ownerName, repoName;
        var dn = 1;
        var _idf=window._idf={};
        var _data = {key:repoName, values: []};
        

        $('#headLine').text(repoName);
        var words = function(sentences){
         
          var sWords = sentences.join(' ').toLowerCase().trim().replace(/[,;.\#\%\@\?\\\!\[\]\`\'\(\)\<\>\{\}\:\+\-\*\/\=\"\$]/g,' ').split(/[\s\/]+/g).sort();
          var iWordsCount = sWords.length; // count w/ duplicates
         
          // array of words to ignore
          var ignore = ['and','the','to','a','of','for','as','i','with','it','is','on','that','this','can','in','be','has','if'];
          ignore = (function(){
            var o = {}; // object prop checking > in array checking
            for ( var i=0; i<100000; i++) {
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
        d3.selectAll('g.tick text').style({'font-size':'1.3em'});

          nv.utils.windowResize(chart.update);

          return chart;
        });

        var render = function(resultData) {
            var freqResult = words(_.pluck(resultData,'body'));

            var maxf = _.max(_.pluck(freqResult,'value'));
            var i;
            for ( i = 0; i < freqResult.length; i++ ) {
                // freqResult[i].value = 0.5 + 0.5*freqResult[i].value/maxf;
                if ( typeof _idf[freqResult[i].label] === 'undefined' ) {
                    _idf[freqResult[i].label]={};
                    _idf[freqResult[i].label].f = 1;
                    _idf[freqResult[i].label].prevDn = dn;
                } else {
                    if (_idf[freqResult[i].label].prevDn < dn) {
                        _idf[freqResult[i].label].prevDn = dn;
                        _idf[freqResult[i].label].f++;
                    }
                }
                _idf[freqResult[i].label].v = Math.log(dn/_idf[freqResult[i].label].f);

                freqResult[i].value *= _idf[freqResult[i].label].v;
            }

            freqResult = _.filter(freqResult, function(item){
                return !_.contains(blackList, item.label);
            });

            freqResult.sort(function(a,b){
                return (a.value > b.value) ? -1 : ((a.value < b.value) ? 1 : 0);
            })

            freqResult = freqResult.slice(0,20);
            // Array.prototype.splice.apply(_data.values,freqResult);
            _data.values = freqResult;
            console.log('#', _data.values)
            d3.select('#chart svg')
            .datum([_data])
            .transition().duration(500)
            .call(chart)
            ;

            d3.selectAll('g.tick text').style({'font-size':'1.3em'});


            // console.log('ch',chart.update);
            chart.update();

        }
        var resultData=[];
        var fetchDone = false;
        var pageNum = 1;
        var fetch = function() {
            $.getJSON('https://api.github.com/repos/'+ownerName+'/'+repoName+'/issues',
            {
                client_id:'',
                client_secret: '',
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
                setTimeout(fetch,500);
            }
        };
        
        $('#fetchBtn').click(function(){
            resultData=[];
            fetchDone = false;
            pageNum = 1;
            dn++;
            ownerName = $('#ownerInput').val();
            $('#ownerInput').val('');
            repoName = $('#repoInput').val();
            $('#repoInput').val('');

            blackList.push(ownerName);
            blackList.push(repoName);

            $('#title').text('Top 20 important keywords from issues of ['+repoName+'] repository');
            fetch();
        });

        window._data = _data;
});