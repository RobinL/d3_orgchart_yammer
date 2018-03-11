d3.csv("tests/for_org_chart.csv", function(csv_data) {

    trees = get_tree_data(csv_data)
    trees = _.sortBy(trees, child_count, "ascending").reverse()

    debugger;
})

