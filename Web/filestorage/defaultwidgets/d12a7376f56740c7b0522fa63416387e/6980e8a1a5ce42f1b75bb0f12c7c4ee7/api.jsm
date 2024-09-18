return {
    getHeatmapBackgroundHtmlColor: function(v) {
        if (v === undefined || v === false) {
            return '#ddd';
        }
        var h = v * 120;
        return "hsl(" + h + ", 100%, 80%)";
    },
    round: function(v) {
        if (v === undefined || v === false) {
            return '';
        }
        
        return (v * 100).toFixed(2);
    }
}