function csv_to_json(csv_data) {
	
	//The sapling will grow into a tree :-p
	//Ids are unique so we can convert array of data into a dict with the id being the key
	
	var sapling = _.object(_.map(csv_data, function(item) {
   			return item.id
	}),csv_data)

	// iterate through each key putting them with their parents

	_.each(sapling, function(item, key) {
		// Once we have an item:
		// if it's got a parent, we need to find the parent, and add it to the parent's children
		//If not, leave it

		if (item.parent != "") {

			var parent_node = null
			console.log("This node has parent id " + item.parent + ".  Looking in array of trees for this parent node")
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

		}

	}) 

	return sapling
}

function find_in_array_of_trees(array_of_trees, parent_id) {

	var parent_id = parent_id
	var found_item = null
	var is_found = false

	function f(node) {
		if (node.id == parent_id) {
			console.log("found the parent node, returning it")
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

		console.log("This item has id: " +  item.id + " and parent id " + item.parent)

		if (!is_found) {
			f(item)
		}

		if (found_item) {
			is_found = true
		}
	})

	return found_item
}


// id									parent
// ecbaee24da9c6ae57bd195bb53a8c157	
// 9b96247538f35dbe04e86200ebb4908b	ecbaee24da9c6ae57bd195bb53a8c157
// 15a987d0c84833ca4bfe61c77dae1fc0	9b96247538f35dbe04e86200ebb4908b
// 491ee869a19bd81bbe9fb39dc924d238	15a987d0c84833ca4bfe61c77dae1fc0
// da7c474ce0cda9e6591a6e5c7dcefe42	ecbaee24da9c6ae57bd195bb53a8c157
// cf27768cffb96d72b40b2a2801164a40	da7c474ce0cda9e6591a6e5c7dcefe42


// {
//    "parent":"",
//    "id":"ecbaee24da9c6ae57bd195bb53a8c157",
//    "children":[
//       {
//          "parent":"ecbaee24da9c6ae57bd195bb53a8c157",
//          "id":"da7c474ce0cda9e6591a6e5c7dcefe42",
//          "children":[
//             {
//                "parent":"da7c474ce0cda9e6591a6e5c7dcefe42",
//                "id":"cf27768cffb96d72b40b2a2801164a40",
//                "children":null,
//             }
//          ],
//       },
//       {
//          "parent":"ecbaee24da9c6ae57bd195bb53a8c157",
//          "id":"9b96247538f35dbe04e86200ebb4908b",
//          "children":[
//             {
//                "parent":"9b96247538f35dbe04e86200ebb4908b",
//                "id":"15a987d0c84833ca4bfe61c77dae1fc0",
//                "children":[
//                   {
//                      "parent":"15a987d0c84833ca4bfe61c77dae1fc0",
//                      "id":"491ee869a19bd81bbe9fb39dc924d238",
//                      "children":null,
//                   }
//                ],
//             }
//          ],
//       }
//    ],
// }