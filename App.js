Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: {
	    type: 'table',
	    columns: 2
	},

	// called when app is loaded
    launch: function() {

    	var that = this;

    	// create a store, which is a query on rally data
    	// in this we are selecting all features which are in state 'Develop'
        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'PortfolioItem/Feature',
            filters : [{
                property : 'State.Name',
                operator : '=',
                value : 'Develop'
            }],
            fetch : ["Name","FormattedID","Parent","UserStories"],
            // fetch : true,
            autoLoad: false
        });

        store.load().then({
        	// once we have all the features, we then want to load the user stories for each feature
        	success : function(features) {
        		console.log("features",features);

        		// we do that by creating an array of 'promises', each promise will load 
        		// the stories for a feature.
				var promises = _.map(features,function(feature){
					return feature.getCollection("UserStories").load()
				});

				// once all the promises are 'resolved' ie. the stories have been loaded for each 
				// feature, then for each feature we want to create a pair of panels, the first will
				// contain the feature name, the second will contain the % done based on the result of 
				// calling a function
				Deft.Promise.all(promises).then({
					success : function(stories) {
						console.log("stories",stories);

						var panels = 
							_.map(stories,function(fs,i){
								return[
									Ext.create('Ext.panel.Panel', {
									    width: 200,
									    html: features[i].get("Name"),
									    margin : "5 5 5 5"
									}),
									Ext.create('Ext.panel.Panel', {
									    width: 200,
									    html: "" +that.storyPercentDone(fs)+"%",
									    margin : "5 5 5 5"
									})
								]
							});
						console.log("panels",panels);
						that.add(_.flatten(panels));
					}
				})
        	}
        })
    },

    // calculate a % done for the feature based on the state of the stories.
    // the feature value is the average of the % done for each story.
    storyPercentDone : function(featureStories) {

    	var percentDone = _.reduce(featureStories,function(total,story){

    		var pd = 0;
    		switch(story.get("ScheduleState")) {
    			case "Defined": pd = 0; break;
    			case "In-Progress": pd = 40; break;
    			case "Completed": pd = 80; break;
    			case "Accepted": pd = 100; break;
    		}
    		return total + pd;

    	},0);

    	return Math.round( featureStories.length > 0 ? percentDone / featureStories.length : 0);

    }
});
