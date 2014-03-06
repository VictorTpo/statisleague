$(document).ready(function(){

	key = "api_key=843e210a-f832-4bba-b9f2-c709d9d809cd";

	get_lol_version();

	//draw_chart_pie(9, 'champ_type', 'Champion Type', 'what you like to play');

	$('#find_summoner').submit(function(){
		$('.games .list').html('');
		get_summ( $('#search_summ_name').val().toLowerCase() );
	});

})

function get_lol_version(){

	url = 'https://prod.api.pvp.net/api/lol/static-data/euw/v1/realm?'+key;
	$.getJSON(url, function(data) {  
		LOL_V  = data.v        
    });	
}

function get_summ(name){
	url = 'https://prod.api.pvp.net/api/lol/euw/v1.3/summoner/by-name/'+name+'?'+key
	$.ajax({
	  dataType: "json",
	  url: url
	}).success(function(summoner){
		summoner = summoner[name];
		$('#sum_id').text(summoner.id);
		$('#sum_name').text(summoner.name);
		$('#sum_lvl').text(summoner.summonerLevel);
		$('.summ_resume').show();
		get_games( $('#sum_id').val() );
	}).fail(function(){
		console.log('fail to find summoner');
	});

}

function get_games(id){
	url_games = 'https://prod.api.pvp.net/api/lol/euw/v1.3/game/by-summoner/'+$('#sum_id').text()+'/recent?'+key
	$.ajax({
	  dataType: "json",
	  url: url_games
	}).success(function(games){
		kills = [];
		deaths = [];
		assists = [];
		champions = {};
		champ_type = [];
		champ_type_cpt = 0;
		type_tmp = [];
		$.each( games.games, function(index, game){

			url_champ = 'https://prod.api.pvp.net/api/lol/static-data/euw/v1/champion/'+game.championId+'?champData=image,tags&'+key
			$.ajax({
			  dataType: "json",
			  url: url_champ
			}).success(function(champion){
				//console.log( champ_type_cpt+' / '+champion.tags)
				champion.tags.forEach(function(tag){
					// console.log('===============================');
					// console.log( 'type_tmp : ' );
					// console.log( type_tmp );
					// console.log( 'champ_type : ' );
					// console.log( champ_type );
					tag_arr = []
					tag_index = type_tmp.indexOf(tag)
					// console.log( 'tag : '+tag+' / index ? '+ tag_index )
					if( tag_index < 0){
						// console.log('-NOT IN-');
						type_tmp.push(tag);
						champ_type.push([tag, 1]);
					}else{
						// console.log('--ALREADY-- '+tag);
						// console.log( champ_type[tag] )
						nb = champ_type[tag_index][1]
						nb++
						champ_type[tag_index] = [tag, nb]
					}
					// console.log( 'type_tmp : ' );
					// console.log( type_tmp );
					// console.log( 'champ_type : ' );
					// console.log( champ_type );
				});
				var key = game.gameId;
			    var val = champion
				champions[key] = val;
				$('.games .list #id_'+game.gameId+' img').attr('src','http://ddragon.leagueoflegends.com/cdn/'+LOL_V+'/img/champion/'+champion.image.full)
				$('.games .list #id_'+game.gameId+' .champion_name').text(champions[game.gameId].name);
				draw_chart_pie(champ_type_cpt, 'champ_type', 'Champion Type', 'what you like to play', champ_type);
				champ_type_cpt++;
			});
			result = "loose";
			if(game.stats.win) result = "win";
			game_html = "<li id='id_"+game.gameId+"' class='game "+result+"'>";
			if( game.subType == "RANKED_SOLO_5x5") game_html += '<div class="ranked"></div>';
			game_html += '<img src="" />';
			game_html += "<span class='champion_name'>loading ...</span><br/>";
			game_html += "<label>Type :</label> <span>"+game.gameMode+"</span><br/>";
			
			kill = game.stats.championsKilled
			if ( isNaN(kill) ) kill = 0
			death = game.stats.numDeaths
			if ( isNaN(death) ) death = 0
			assist = game.stats.assists
			if ( isNaN(assist) ) assist = 0

			kills.push(kill);
			deaths.push(death);
			assists.push(assist);

			game_html += "<div class='kda'><label>KDA :</label> <span>"+kill+" - "+death+" - "+assist+"</span></div>";
			game_html += "</li>";

			$('.games .list').append(game_html)
			$('.games').show();
			
		})
		
		kdas_names = ['kills', 'deaths', 'assists'];
		kdas_colors = ['#c20005', '#3f3f3f', '#e6df68'];
		//console.log(deaths)
		kdas_data = [kills.reverse(), deaths.reverse(), assists.reverse()];
		draw_chart('chart_kda', 'KDA statistics', '10 last games', 10, '', kdas_names, kdas_data, kdas_colors);

	}).fail(function(){
		console.log('fail to load games');
	});
}

function draw_chart(dom, title, sub, axeX, yValue, series_name, series_data, series_colors){
	
	//init chart
	var chart = new Highcharts.Chart({
		chart:{
			renderTo: dom,
		},
	    title: {
	        text: title
	    },
	    subtitle: {
	        text: sub
	    },
	    xAxis: {
	        categories: axeX
	    },
	    yAxis: {
	    	min: 0,
	        title: {
	            text: yValue
	        },
	        plotLines: [{
	            value: 0,
	            width: 1,
	            color: '#808080'
	        }]
	    },
	    tooltip: {
	        valueSuffix: ''
	    },
	    legend: {
	        layout: 'vertical',
	        align: 'right',
	        verticalAlign: 'middle',
	        borderWidth: 0
	    }
	}); //end init chart

	series_data.forEach(function(serie, index){
		serie = chart.addSeries({
			name: series_name[index],
			data: serie,
			color: series_colors[index],
			marker:{
				symbol: 'circle'
			}
		});
	})
	
}

function draw_chart_pie(cpt, dom, title, sub, series_data){
	if(cpt == 9){
		//init chart
		var chart_pie = new Highcharts.Chart({
			chart:{
				renderTo: dom,
			},
		    title: {
		        text: title,
		        align: 'center',
            	verticalAlign: 'middle',
            	y: 80
		    },
		    subtitle: {
		        text: sub
		    },
	        tooltip: {
	            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
	        },
	        plotOptions: {
	            pie: {
	                dataLabels: {
	                    enabled: true,
	                    distance: -50,
	                    style: {
	                        fontWeight: 'bold',
	                        color: 'white',
	                        textShadow: '0px 1px 2px black'
	                    }
	                },
	                startAngle: -90,
	                endAngle: 90,
	                center: ['50%', '75%']
	            }
	        },
		    legend: {
		        layout: 'vertical',
		        align: 'right',
		        verticalAlign: 'middle',
		        borderWidth: 0
		    }
		}); //end init chart

		console.log( series_data )
		test = [
		        ['Firefox',   45.0],
		        ['IE',       26.8],
		        ['Chrome', 12.8],
		        ['Safari',    8.5],
		        ['Opera',     6.2],
		        ['Others',   0.7]
		    ]

		chart_pie.addSeries({
		    type: 'pie',
		    innerSize: '50%',
		    data: series_data
		})
	}
}