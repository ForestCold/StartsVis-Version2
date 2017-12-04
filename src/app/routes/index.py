import json
import os

from app import app
from flask import Flask, request

debug = False

# default: single module project
mode = "single"

# projects' name
project_name = "null"

# if show library
show_library = False

@app.route('/')
def root():
	return app.send_static_file('index.html')

@app.route('/list')
def _list():
	datalist = [name for name in os.listdir("app/data")]

	if ".DS_Store" in datalist:
		datalist.remove(".DS_Store")

	return json.dumps(datalist)

@app.route('/node_filter')
def _node_filter():

	selected_nodes = json.loads(request.args["node"])
	module = request.args["module"]
	module = module[1:len(module) - 1]
	data = {}

	if os.path.isfile('app/data/' + module + '/.starts' + "/generated-data.json"):
		with open('app/data/' + module + '/.starts' + "/generated-data.json") as f:
			data = json.load(f)
	elif os.path.isfile('app/data/' + project_name + '/' + module + '/.starts' + "/generated-data.json"):
		with open('app/data/' + project_name + '/' + module + '/.starts' + "/generated-data.json") as f:
			data = json.load(f)

	if isinstance(selected_nodes, list):
		return json.dumps(data["graph"])

	links = data["graph"]["links"]
	nodes = data["graph"]["nodes"]
	t_c_link = data["father_matrix"]
	c_t_link = data["child_matrix"]

	selected = {}

	for t in selected_nodes["test"]:
		selected[t] = True
	for c in selected_nodes["class"]:
		selected[c] = True

	new_links = []
	new_nodes = {}

	for node in nodes:
		if is_element_in_dict(int(node), selected):
			new_nodes[node] = nodes[node]
	data["graph"]["nodes"] = new_nodes

	count = 0
	for t in selected_nodes["test"]:
		if not is_element_in_dict(str(t), t_c_link):
			continue
		for c in t_c_link[str(t)]:
			if is_element_in_dict(int(c), selected):
				if t_c_link[str(t)][c] == 1:
					typo = "real"
				else:
					typo = "virtual"
				link = {
					"source" : t,
					"target" : c,
					"value" : 1,
					"type" : typo,
					"id" : count
				}
				count += 1
				new_links.append(link)

	for c in selected_nodes["class"]:
		if not is_element_in_dict(str(c), c_t_link):
			continue
		for n in c_t_link[str(c)]:
			if is_element_in_dict(int(n), selected):
				if c_t_link[str(c)][n] == 1:
					typo = "real"
				else:
					typo = "virtual"
				link = {
					"source" : n,
					"target" : c,
					"value" : 1,
					"type" : typo,
					"id" : count
				}
				count += 1
				new_links.append(link)

	data["graph"]["links"] = new_links

	return json.dumps(data["graph"])

#load raw data from projects' directory
@app.route('/data/<data_name>')
def _load(data_name):

	global mode
	global project_name
	mode = "single"

	project_name = data_name

	fpath = 'app/data/' + project_name + '/' + "pom.xml"

	#modules
	modules = []
	tmp = []

	#read modules line
	with open(fpath) as f:
		for line in f.readlines():
			if "</modules>" in line:
				break
			if mode == "multi":
				tmp.append(line)
			if "<modules>" in line:
				mode = "multi"

	#read modules name
	if len(tmp) > 0:
		for module in tmp:
			modules.append(module[10:-10])
	else:
		modules.append(str(project_name))

	#load each module
	modules = load_modules(modules)

	return json.dumps(modules)

# load data for each module
def load_modules(modules):

	global project_name
	modules_data = {}

	for module in modules:

		if len(modules) == 1:
			fpath = 'app/data/' + module + '/.starts'
		else:
			fpath = 'app/data/' + project_name + '/' + module + '/.starts'

		if os.path.isfile(fpath + "/generated-data.json"):
			with open(fpath + "/generated-data.json") as f:
				modules_data[module] = json.load(f)
				continue

		tests = load_tests(fpath)
		classes = load_classes(fpath)
		graph = load_graph(fpath, tests, classes)

		if graph == "none" or len(graph["libraries"]["id_libraries_map"]) == 0:
			modules_data[module] = "none"

		else:
			# remove tests from classes set
			for c in classes["classes_id_map"].keys():
				if is_element_in_dict(c, tests["tests_id_map"]):
					cid = classes["classes_id_map"][c]
					del classes["classes_id_map"][c]
					del classes["id_classes_map"][cid]

			links = graph["links"]
			libraries = graph["libraries"]
			graph = parse_graph(links, tests, classes, libraries)
			matrix_and_trees = generate_matrix_and_trees(graph, tests["id_tests_map"], classes["id_classes_map"])
			matrix = matrix_and_trees["matrix"]
			trees = matrix_and_trees["trees"]
			father_matrix = matrix_and_trees["father_matrix"]
			child_matrix = matrix_and_trees["child_matrix"]

			modules_data[module] = {
				"tests" : tests,
				"classes" : classes,
				"libraries" : libraries,
				"graph" : graph,
				"matrix" : matrix,
				"trees" : trees,
				"father_matrix" : father_matrix,
				"child_matrix" : child_matrix
			}

		with open(fpath + "/generated-data.json", "wb") as f:
			f.write(json.dumps(modules_data[module]))

	return modules_data

def load_graph(fpath, tests, classes):

	if not os.path.exists(fpath + '/graph'):
		return "none"

	links = []

	# use dict to accelerate finding process
	id_libraries_map = {}
	libraries_id_map = {}
	libraries = {}

	count = 0

	#save links and library nodes
	with open(fpath + '/graph') as f:
		for line in f.readlines():

			source = line.split()[0]
			target = line.split()[1]

			if not is_element_in_dict(source, tests["tests_id_map"]) and not is_element_in_dict(source, classes["classes_id_map"]) and not is_element_in_dict(source, libraries_id_map):
				id_libraries_map[count] = source
				libraries_id_map[source] = count
				count += 1

			if not is_element_in_dict(target, tests["tests_id_map"]) and not is_element_in_dict(target, classes["classes_id_map"]) and not is_element_in_dict(target, libraries_id_map):
				id_libraries_map[count] = target
				libraries_id_map[target] = count
				count += 1

			link = {
				"source" : source,
				"target" : target,
				"value" : 1,
				"type" : "real"
			}

			links.append(link)

	libraries = {
		"libraries_id_map" : libraries_id_map,
		"id_libraries_map" : id_libraries_map
	}

	graph = {
		"links" : links,
		"libraries" : libraries
	}

	return graph

def load_tests(fpath):

	id_tests_map = {}
	tests_id_map = {}
	result = {}
	count = 0

	if not os.path.exists(fpath + '/all-tests'):
		return "none"

	with open(fpath + '/all-tests') as f:
		for line in f.readlines():
			id_tests_map[count] = line.strip('\n')
			tests_id_map[line.strip('\n')] = count
			count += 1

	result = {
		"id_tests_map" : id_tests_map,
		"tests_id_map" : tests_id_map
	}

	return result

def load_classes(fpath):

	id_classes_map = {}
	classes_id_map = {}
	result = {}

	count = 0

	if not os.path.exists(fpath + '/jdeps-out'):
		return "none"

	with open(fpath + '/jdeps-out') as f:
		for line in f.readlines():
			id_classes_map[count] = line.split(',')[0]
			classes_id_map[line.split(',')[0]] = count
			count += 1

	result = {
		"id_classes_map" : id_classes_map,
		"classes_id_map" : classes_id_map
	}

	return result

# private function

# parse nodes and links
def parse_graph(in_links, tests, classes, libraries):

	links = []
	nodes = {}
	nodes_set = []

	fathers = {}
	children = {}

	node_id_map = {}

	# parse nodes
	for t in tests["tests_id_map"]:
		node = {
			"id" : len(nodes_set),
			"value" : t,
			"size" : 2,
			"type" : "test"
		}
		node_id_map[node["value"]] = node["id"]
		nodes_set.append(node)
		nodes[node["id"]] = node

	for c in classes["classes_id_map"]:
		node = {
			"id" : len(nodes_set),
			"value" : c,
			"size" : 2,
			"type" : "class"
		}
		node_id_map[node["value"]] = node["id"]
		nodes_set.append(node)
		nodes[node["id"]] = node

	for l in libraries["libraries_id_map"]:
		node = {
			"id" : len(nodes_set),
			"value" : l,
			"size" : 2,
			"type" : "class"
		}
		nodes_set.append(node)
		if show_library:
			nodes[node["id"]] = node
		node_id_map[node["value"]] = node["id"]

	#parse links
	count = 0

	for l in in_links:

		# transform name to id
		l["source"] = node_id_map[l["source"]]
		l["target"] = node_id_map[l["target"]]
		l["id"] = count

		# define fathers
		if is_element_in_dict(l["source"], fathers):
			fathers[l["source"]].append(l["target"])
		else:
			fathers[l["source"]] = []
			fathers[l["source"]].append(l["target"])

		# define children
		if is_element_in_dict(l["target"],children):
			children[l["target"]].append(l["source"])
		else:
			children[l["target"]] = []
			children[l["target"]].append(l["source"])

		links.append(l)
		count += 1

	if not show_library:
		links = link_filter(links, nodes, fathers, children)

	graph = {
		"links" : links,
		"nodes" : nodes,
		"fathers" : fathers,
		"children" : children
	}

	return graph

# generate a test-class dependency matrix
def generate_matrix_and_trees(graph, tests, classes):

	father_matrix = {}
	child_matrix = {}
	father_tree = {}
	child_tree = {}

	for line in graph["links"]:

		count = 1
		source = graph["nodes"][line["source"]]
		target = graph["nodes"][line["target"]]

		# if source is a test and it depends on a class, add to the matrix
		if source["type"] == "test" and target["type"] == "class":

			if is_element_in_dict(source["id"], father_matrix):
				father_matrix[source["id"]][target["id"]] = count
				father_root = father_tree[source["id"]]

			else:
				father_matrix[source["id"]] = {
					target["id"] : count
				}
				father_root = {
					"name" : source["id"],
					"children" : []
				}

			item = {
				"name" : target["id"],
				"children" :[]
			}

			# link source with class's fathers
			tree = recurse_add_father(graph, graph["fathers"], source["id"], target["id"], father_matrix, count, item)
			father_matrix = tree["matrix"]
			father_root["children"].append(tree["root"])
			father_tree[source["id"]] = father_root

		if target["type"] == "class":

			if is_element_in_dict(target["id"], child_matrix):
				child_matrix[target["id"]][source["id"]] = True
				child_root = child_tree[target["id"]]
			else:
				child_matrix[target["id"]] = {
					source["id"] : count
				}
				child_root = {
					"name" : target["id"],
					"children" : []
				}

			item = {
				"name" : source["id"],
				"children" :[]
			}

			c_tree = recurse_add_child(graph, graph["children"], source["id"], target["id"], child_matrix, count, item)
			child_matrix = c_tree["matrix"]
			child_root["children"].append(c_tree["root"])
			child_tree[target["id"]] = child_root

	# parse matrix
	matrix_result = []
	for test in father_matrix:
		for crass in father_matrix[test]:
			new_item = {
				"test" : test,
				"class" : crass,
				"value" : father_matrix[test][crass]
			}
			matrix_result.append(new_item)

	result = {
		"matrix" : matrix_result,
		"trees" : {
			"child_trees" : child_tree,
			"father_trees" : father_tree
		},
		"father_matrix" : father_matrix,
		"child_matrix" : child_matrix
	}

	return result

def recurse_add_child(graph, relations, source, crass, matrix, count, father):

	if not is_element_in_dict(source, relations):
		result = {
			"matrix" : matrix,
			"root" : father
		}
		return result

	for relation in relations[source]:

		# if test-father is a library
		if not show_library and relation >= len(graph["nodes"]):
			continue

		# if class-child link already exist, pre-prune
		if is_element_in_dict(relation, matrix[crass]):
			continue;

		else:
			count += 1
			matrix[crass][relation] = count
			leaf = {
				"name" : relation,
				"children" : []
			}
			r = recurse_add_child(graph, relations, relation, crass, matrix, count, leaf)
			father["children"].append(r["root"])
			count -= 1

	result = {
		"matrix" : matrix,
		"root" : father
	}

	return result

def recurse_add_father(graph, relations, test, crass, matrix, count, father):

	for relation in relations[crass]:

		# if test-father is a library
		if not show_library and relation >= len(graph["nodes"]):
			continue

		if graph["nodes"][relation]["type"] == "class":

			# if test-father link already exist, pre-prune
			if is_element_in_dict(relation, matrix[test]):
				continue;

			else:
				count += 1
				matrix[test][relation] = count
				leaf = {
					"name" : relation,
					"children" : []
				}
				r = recurse_add_father(graph, relations, test, relation, matrix, count, leaf)
				father["children"].append(r["root"])
				count -= 1

	result = {
		"matrix" : matrix,
		"root" : father
	}

	return result

def is_element_in_dict(elem, dict):
	return dict.has_key(elem)

# filter links by removing libraries
def link_filter(links, nodes, fathers, children):

	removed_links = {}
	index = -1
	new_links = []

	count = len(links)

	for link in links:

		# if source and target both in remove nodes set, remove the link
		if link["source"] >= len(nodes) and link["target"] >= len(nodes):
			removed_links[link["id"]] = True;
			continue

		# if source in remove nodes set, remove link and link target with source's children
		elif link["source"] >= len(nodes):
			index = link["source"]
			removed_links[link["id"]] = True;

			#link offsprings
			if children.has_key(index) and len(children[index]) > 0:
				for child in children[index]:
					if children < len(nodes):
						link = {
							"source": child,
							"target": link["target"],
							"value": 1,
							"type": "virtual",
							"id" : count
						}
						new_links.append(link)
						count += 1
			continue

		# if target in remove nodes set, remove link and link source with target's father
		elif link["target"] >= len(nodes):
			index = link["target"]
			removed_links[link["id"]] = True;

			#link ancestors
			if fathers.has_key(index) and len(fathers[index]) > 0:
				for father in fathers[index]:
					if father < len(nodes):
						link = {
							"source": link["source"],
							"target": father,
							"value": 1,
							"type": "virtual",
							"id" : count
						}
						new_links.append(link)
						count += 1
			continue

	# remove links in removed_links
	result = []
 	for link in links:
 		if not is_element_in_dict(link["id"], removed_links):
 			result.append(link)

	# add new links
	for link in new_links:
		result.append(link)

	return result
