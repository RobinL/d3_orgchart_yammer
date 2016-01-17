function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null; //_children is potential childern, children is displayed children 
    }
}

function expand(d){   
    var children = (d.children)?d.children:d._children;
    if (d._children) {        
        d.children = d._children;
        d._children = null;       
    }
    if(children)
      children.forEach(expand);
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

    var MIN_HEIGHT = 400    
    var NODE_HEIGHT = 35
    var NODE_SPACING = 10
    var FONT_SIZE = 10

    

    // $("#svgholder")
    var all_data = all_data
    var duration = 750

    var selection_string = selection_string

    var total_height = 400; //Take height and width from size of svg container

    var total_width = $(selection_string).width();

    var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 50
    };

    var width = total_width - margin.right - margin.left;
    var height = total_height - margin.top - margin.bottom;

    var LINK_WIDTH = 220

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    var svg = d3.select(selection_string).append("svg")
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

    $("#MIN_HEIGHT").on("change", redraw)
    $("#NODE_HEIGHT").on("change", redraw)
    $("#NODE_SPACING").on("change", redraw)
    $("#LINK_WIDTH").on("change", redraw)
    $("#FONT_SIZE").on("change", redraw)

    //For drawing tree starting from a particular node
    function get_root_from_id(userid, tree) {

        var found = tree
        var userid = userid


        function recurse(node) {
            if (node["id"] == userid) {
                found = node
            } else {
                if (node.children) {
                    for (var i = 0; i < node["children"].length; i++) {
                        recurse(node["children"][i])
                    }
                }
            };
        }

        if (tree["id"] == userid) {
            found = tree
        } else {
            recurse(tree)
        }

        return found
    }


    function change_root(userid) {

        root = all_data.tree;

        if (userid != "") {
            root = get_root_from_id(userid,root)
        }

        expand(root)
        redraw(root)

    }



    function get_max_height() {

        var count_nodes = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]  //count of nodes at each level
        var gaps =  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] 
        var gaps_2 = 0
        var max_level = 0

        function recurse(node,level) {
            var level = level + 1
            max_level = Math.max(level, max_level)

            if (node["children"]) {
                count_nodes[level] += node["children"].length
                gaps[level] += 1
                gaps_2 +=1

                for (var i = 0; i < node["children"].length; i++) {
                    recurse(node["children"][i],level)
                };

            }

        }

        recurse(root,0)

        var nodes_contribution  = Math.max.apply(Math, count_nodes)*(NODE_HEIGHT + NODE_SPACING)
        // var gap_contribution = Math.max.apply(Math, gaps)*55
        var gap_contribution = NODE_HEIGHT*gaps_2
        var levels_contribution = (max_level-1) * (NODE_SPACING + NODE_SPACING)


        return  Math.max(nodes_contribution + gap_contribution + levels_contribution, MIN_HEIGHT)

    }


    function redraw(source) {

        MIN_HEIGHT = parseFloat($("#MIN_HEIGHT").val())
        NODE_HEIGHT = parseFloat($("#NODE_HEIGHT").val())
        NODE_SPACING = parseFloat($("#NODE_SPACING").val())
        LINK_WIDTH = parseFloat($("#LINK_WIDTH").val())
        FONT_SIZE = parseFloat($("#FONT_SIZE").val())

        //Does the height need to be updated?

        var new_height =  get_max_height(root)

        // If getting bigger, immediately make svg bigger 
        var new_width = (find_depth()+1)*LINK_WIDTH + margin.left + margin.right
        

        console.log(new_height + " " + new_width)

        // Transition to new height and width
        d3.select(selection_string)
            .select("svg")
            .transition()
            .duration(duration)
            .attr("height", new_height+margin.top+margin.bottom)
            .attr("width", new_width+margin.left+margin.right)
            .transition()

        tree = d3.layout.tree()
             .size([new_height, new_width]);


        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
            d.y = d.depth * LINK_WIDTH;
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
        
            .attr("width", function(d) {
                return 500
            })
            .attr("height", 400)

            .attr("y", function(d) {
                return NODE_HEIGHT 
            })
            .attr("x", "-100")
            .attr("class", "foo")
            .append("xhtml:div")
            
            .attr("dy", "0")
            .attr("x", function(d) {
                return 10
            })
     

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });


       
        node
            .select(".foo")
            .attr("y", function(d) {
                    return -(NODE_HEIGHT/2)
            })
            .attr("x", function(d) {
                return -(NODE_HEIGHT/2)
            })
         
           
            .html(function(d) {
                var source = d3.select("#foreignobject-template").html();
                var template = Handlebars.compile(source);

                var template_data = {}
                template_data.full_name = d.full_name
                template_data.job_title = d.job_title
                template_data.mugshot_url_template = d.mugshot_url_template.replace("200","200").replace("200","200") 
                template_data.imgwidth = NODE_HEIGHT +'px'
                template_data.imgheight =  NODE_HEIGHT +'px'
                template_data.totalheight = NODE_HEIGHT + 'px'
                template_data.textwidth = (LINK_WIDTH - (NODE_HEIGHT)-20) + "px"
                template_data.bordercolour = color_scale(d.messages_in_last_180_days)
                template_data.user_id = d.id
                template_data.font_size = FONT_SIZE
                if (NODE_HEIGHT > 25) {
                template_data.include_job_title = true
                } else {
                    template_data.include_job_title = false
                }


                var html = template(template_data);
                return html
            })
            .on("mouseover", function(d) {
                create_profile_card(d)

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
            .remove()


        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

    }


    function tree_search(id) {

        root = all_data.tree

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

        $('#orgchart_starting_here').on("click", function(d) {

            userid = $(this).attr("data_user_id")
            change_root(userid)

        });

 
    }




    return {
        // resize_chart: resize_chart,
        redraw: redraw,
        tree_search: tree_search
    }
}



d3.json("data/orgchart_data.json", function(error, data) {


    $(".maindiv").css("visibility", "visible" )
    $("#import_csvs").css("display", "none" )
    $("#tips").css("visibility", "visible" )


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



});


function shorten_text(my_string) {
    var max_len = 65
    if (my_string.length > max_len) {
        my_string = my_string.substring(0, max_len - 3) + "..."
    }
    return my_string
}






// The following code handles the file upload - can be deleted once hosted somewhere secure

function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        isCompatible = true;
    }
    return isCompatible;
}

// d3.select("#txtFileUpload").on("change", upload)

// function upload() {

//     if (!browserSupportFileUpload()) {
//         alert('The File APIs are not fully supported in this browser!');
//     } else {

//         var data = null;
//         var file = this.files[0];
//         var reader = new FileReader();
//         reader.readAsText(file);

//         reader.onload = function(event) {
//             var jsonData = event.target.result;
//             data = JSON.parse(jsonData);

//             $(".maindiv").css("visibility", "visible" )
//             $("#import_csvs").css("display", "none" )
//             $("#tips").css("visibility", "visible" )


//             var chart = organisation_chart(data, "#svgholder")


//             // Create search box
//             $("#search_box").select2({

//                 allowClear: true,
//                 placeholder: "Type here to search or click on nodes to expand/contract organisation chart",
//                 data: data.select_box,
//                 width: "100%"
//             });



//             $('#search_box').on("change", function(d) {
//                 search_id = $("#search_box").val()
//                 chart.tree_search(search_id)
//             });
//         };
//         reader.onerror = function() {
//             alert('Unable to read ' + file.fileName);
//         };
//     }

// }