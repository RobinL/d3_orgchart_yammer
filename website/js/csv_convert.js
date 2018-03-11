function csv_to_json(csv_data) {


	var select_box_data =  get_select_box_data(csv_data)

	//get_tree_data modifies csv_data
	csv_data_copy = Object.create(csv_data)
	var tree = get_tree_data(csv_data_copy)

	return {select_box: select_box_data, tree: tree}

}

function get_select_box_data(csv_data) {

	return_array = _.map(csv_data, function(d) {
		return {id: d.id, text: d.first_name + " " + d.last_name}
	})

	return return_array
}


// Want to get all trees, by tree size
function get_tree_data(csv_data) {


	//The sapling will grow into a tree :-p
	//Ids are unique so we can convert array of data into a dict with the id being the key
	var sapling = _.object(_.map(csv_data, function(item) {
   			return item.id
	}),csv_data)

	// iterate through each key putting them with their parents

	var head_honchos = []
	_.each(sapling, function(item, key) {
		// Once we have an item:
		// if it's got a parent, we need to find the parent, and add it to the parent's children
		//If not, leave it

		if (item.parent != "") {

			var parent_node = null
			// console.log("This node has parent id " + item.parent + ".  Looking in array of trees for this parent node")
			var parent_node = find_in_array_of_trees(sapling, item.parent)

			// if we find the id
			if (parent_node) {

				if (parent_node.children) {
					parent_node.children.push(item)
				} else {
					parent_node.children = [item]
				}

				delete sapling[key]

			}

		} else {
			head_honchos.push(item.id)
		}

	})

	trees = head_honchos.map(function(hh) {return sapling[hh]})
	trees = _.sortBy(trees, child_count, "ascending").reverse()
	_.each(trees, function(t) {t["parent"] = "hidden_node"})
	tree = {"id": "hidden_node", "children": trees, "parent": ""}

	return tree  //The sapling should now be a tree!

}

function child_count(tree) {

	if ("children" in tree) {
		child_counts = _.map(tree["children"], function(child) {
			return child_count(child)
		})

       return 1 + _.reduce(child_counts, function(a,b) {return a+b})
	} else {
		return 1
	}
}

function check_initial_csv(csv_data, error_list) {
	//Check there is a single node with a blank parent

	var blank_parents = _.reduce(csv_data, function(memo, d) {
		return memo + (d.parent == "");
	}, 0)

	if (blank_parents == 0) {
		error_list.push("There are no nodes with a blank parent")
	}

	if (blank_parents>1) {
		error_list.push("There is more than one node with a blank parent - you can't have two ceos!")
	}

	//Check that all other nodes have a parent that exists
	var ids_set = []
	_.each(csv_data, function(d) {
		ids_set.push(d.id);
	})
	ids_set.push("")

	_.each(csv_data, function(d) {
		var parent_exists = _.contains(ids_set, d.parent);

		if (!(parent_exists)) {
			error_list.push("The parent (line manager) id for " + d.full_name + " doesn't seem to exist - is there a record for their line manager and is the ID correct?")
		}
	})


	//Check no two nodes have the same id
	var groups = _.groupBy(csv_data, function(d) {
		return d.id
	})

	_.each(groups, function(item,key) {
		if (item.length>1) {
			error_list.push("Thre are duplicate records with id: " + key + ". There are " + item.length + " records with this id.")
		}
	})

	return error_list

}


function find_in_array_of_trees(array_of_trees, parent_id) {

	var parent_id = parent_id
	var found_item = null
	var is_found = false

	function f(node) {
		if (node.id == parent_id) {
			// console.log("found the parent node, returning it")
			found_item = node
			is_found = true
		} else {
			// for each child call f
			if (node.children) {
				_.each(node.children, function(child) {
					f(child)
				})
			}

		}
	}


	_.each(array_of_trees, function(item, key) {

		// console.log("This item has id: " +  item.id + " and parent id " + item.parent)

		if (!is_found) {
			f(item)
		}

		if (found_item) {
			is_found = true
		}
	})

	return found_item
}
