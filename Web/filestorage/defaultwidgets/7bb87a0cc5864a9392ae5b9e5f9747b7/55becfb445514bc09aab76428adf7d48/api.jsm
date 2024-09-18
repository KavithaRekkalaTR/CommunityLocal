return {
    getCategoryLocation: function(c) {
        var location = [];
        var parent = c.Parent;
        while (parent != null) {
            location.unshift(parent.Name);
            parent = parent.Parent;
        }
        if (location.length == 0)
            return '';
        else
            return ' (' + location.join(' &gt; ') + ')';
    }
};