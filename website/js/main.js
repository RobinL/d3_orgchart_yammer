function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null; //_children is potential childern, children is displayed children 
    }
}

function endall(transition, callback) { 

    if (transition.size() === 0) { callback() }
    var n = 0; 
    transition 
        .each(function() { ++n; }) 
        .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
  } 


// Main container for the organisation chart - writes the org chart into the dom element specified by the jquery selection
function organisation_chart(all_data, selection_string) {

    // $("#svgholder")
    var all_data = all_data
    var duration = 750

    var selection_string = selection_string

    var total_height = $(selection_string).height(); //Take height and width from size of svg container

    total_height = Math.max(total_height, 600)-30


    var total_width = $(selection_string).width();

    var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    };

    var width = total_width - margin.right - margin.left;
    var height = total_height - margin.top - margin.bottom;

    var link_width = 220

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    var svg = d3.select("#svgholder").append("svg")
        .attr("width", total_width)
        .attr("height", total_height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var root = all_data.tree;
    root.x0 = height / 2;
    root.y0 = 0;

    //root.children[0].children.forEach(collapse); //On first run collapse all but directors

    root.children.forEach(collapse); //On first run collapse all but directors



    create_profile_card(root)

    redraw(root)

    function redraw_from_scratch() {

        total_height = $(selection_string).height();

        total_height = Math.max(total_height, 600)-30

        total_width = $(selection_string).width();

        width = total_width - margin.right - margin.left;
        height = total_height - margin.top - margin.bottom;

        d3.select(selection_string).select("svg")
            .attr("width", total_width)
            .attr("height", total_height)


        tree = d3.layout.tree()
            .size([height, width]);

        root = all_data.tree;

        redraw(root)
    }


    function redraw(source) {

        // If getting bigger, immediately make svg bigger 
        var current_width = d3.select(selection_string).select("svg").attr("width")
        var new_width = (find_depth()+1)*link_width

        if (Math.max(current_width, new_width) >  $("#svgholder").width()){
            var scroll_needed = true
        }

        var scrollamount = new_width - current_width
        if (scrollamount > 0) {
            var scroll_left = "+=" + scrollamount
        } else {
            var scroll_left = "-=" + (scrollamount * -1)

        }

        if (new_width > current_width) {
            d3.select(selection_string).select("svg")
                .attr("width", new_width)
        }

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
            d.y = d.depth * link_width;
        });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", click);


        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });


        var color_scale = d3.scale.linear()
            .domain([0, 10, 38])
            .range(["blue", "purple", "red"]);

        nodeEnter
            .append("foreignObject")
            .attr("height", function(d) {
                return '44px'
            })
            .attr("width", function(d) {
                return link_width
            })

            .attr("y", "-20")
            .attr("x", "-10")
            .append("xhtml:div")
            .attr("dy", ".75em")
            .attr("x", function(d) {
                return d.children || d._children ? -10 : 10;
            })
            .html(function(d) {
                var source = d3.select("#foreignobject-template").html();
                var template = Handlebars.compile(source);

                var template_data = {}
                template_data.full_name = d.full_name
                template_data.job_title = d.job_title
                template_data.mugshot_url_template = d.mugshot_url_template.replace("200","100").replace("200","100") 
                template_data.imgwidth = '35px'
                template_data.imgheight =  '35px'
                template_data.totalheight = '44px'
                template_data.textwidth = (link_width - 40) + "px"
                template_data.bordercolour = color_scale(d.messages_in_last_180_days)
                template_data.user_id = d.id


                var html = template(template_data);
                return html
            })
            .on("mouseover", function(d) {
                create_profile_card(d)

            })

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            })
             .call(endall, function(d) {
                if (new_width > current_width & scroll_needed) {
                    $('#svgholder').animate({
                        scrollLeft: scroll_left
                    }, duration)
           
                }
            })
            

        nodeUpdate.select("circle")
            .attr("r", function(d) {
                if (d.successful_search) {
                    return 6
                }
                return 4.5
            })
            .style("fill", function(d) {
                if (d.successful_search) {
                    return "red"
                }
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove()
            ;

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal)

        
        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
             .call(endall, function(d) {
                if (new_width <= current_width & scroll_needed) {
                    d3.select(selection_string).select("svg")
                        .attr("width", new_width)
                }
            })
            .remove()
            .call(endall, function(d) {
                         d3.select(selection_string).select("svg")
                         .transition()
                         .duration(duration)
                        .attr("width", new_width)
            });

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

    }


    function tree_search(id) {

        function searchpath_false_all() {

            function set_false(node) {
                node.foundpath = false
                node.successful_search = false
                if (node._children) {
                    node._children.forEach(set_false);
                }

            }

            set_false(root)
        }

        //Search through the nodes of the organisation chart keeping track of 
        //the full line management chain for the staff member being searched for


        //Strategy is to collapse all nodes in the data structure and then open 
        //them back out one by one 
        if (root.children) {
            root.children.forEach(collapse);
        }
        collapse(root);

        //Set every node to have a searchpath property set to false
        searchpath_false_all()


        var id = id
        var found = false


        function recurse_search(node) {


            // Don't go any further into the tree if found
            if (found) {
                return
            }

            node.foundpath = true

            // Where foundpath = true expand nodes
            if (node._children) {
                node.children = node._children;
                node._children = null
            }

            if (node.id == id) {
                found = true
                if (node.children) {
                    node._children = node.children
                    node.children = null
                }

                node.successful_search = true

                // And display popup data
                create_profile_card(node)

                return
            }


            if (node.children) {
                node.children.forEach(recurse_search);
            }


            // The code is hit as we 'exit the recursion'
            // If we've explored this aprt of the tree and are bubbling back up
            //But we haven't found the node, we need to 'tell the tree'
            //That this isn't the right found path
            if (found == false) {
                node.foundpath = false

                if (node.children) {
                    node._children = node.children;
                    node.children = null
                }
            }

        }

        recurse_search(root, id)

        redraw(root);
    }


    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }

        d.successful_search = false
        redraw(d);
    }

    //Recursively find the max depth node
    function find_depth() {

        var max_depth = 0

        function recurse_depth(node, current_depth) {

                max_depth = Math.max(max_depth, current_depth)
                if (node.children) {
                    for (var i = 0; i < node.children.length; i++) {
                        recurse_depth(node.children[i],current_depth +1)
                    };

                }
            }


        recurse_depth(root,0)

        return max_depth

    }

    return {
        redraw_from_scratch: redraw_from_scratch,
        redraw: redraw,
        tree_search: tree_search
    }
}



d3.json("data/orgchart_data.json", function(error, data) {

    var chart = organisation_chart(data, "#svgholder")


    // Create search box
    $("#search_box").select2({

        allowClear: true,
        placeholder: "Type here to search or click on nodes to expand/contract organisation chart",
        data: data.select_box,
        width: "100%"
    });



    $('#search_box').on("change", function(d) {
        search_id = $("#search_box").val()
        chart.tree_search(search_id)
    });

    $(window).resize(function() {

        chart.redraw_from_scratch()

    })



});


function shorten_text(my_string) {
    var max_len = 65
    if (my_string.length > max_len) {
        my_string = my_string.substring(0, max_len - 3) + "..."
    }
    return my_string
}


function create_profile_card(d) {
    var div = d3.select(".tooltip")
    div.transition()
        .duration(200)
        .style("opacity", .9);
    div.html(function(d2) {
        var source = d3.select("#entry-template").html();
        var template = Handlebars.compile(source);

        var html = template(d);
        return html
    })
}

