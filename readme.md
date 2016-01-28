##Interactive, searchable d3 organisation charts

This repo contains all the code you need to create an interactive, searchable organisational chart.

It was built to work with data from the Yammer API, but has since been adapted to work with data from any source, provided in csv format.

Works in modern browsers.

You can find a demo [here](http://robinl.github.io/d3_orgchart_yammer/website/ "here") that uses faked data.  If you pull data from the Yammer API using the provided Python scripts, it will automatically pick up profile pics, contact details etc..


###Instructions to get up and running:

####If you want to use real Yammer data from your organisation:

1. Grab your Yammer authentication here:

    This is a string that looks something like :"Bearer 000000-test"

    Insert it into "Get data from Yammer.ipynb" and run.

    These scripts download quite a lot of data from Yammer and will take some time to run.

    The output is a json file in `/website/data/orgchart_data.json`

    This will overwrite the existing file, which is an example that uses fake data.

2.  Run "Process Yammer data.ipynb"


#####If you do not want to use data from Yammer

cd to the 'website' directory and type `python -m SimpleHTTPServer` and navigate to `http://127.0.0.1:8000/` in your web browser.

This will use the faked data at `/website/data/random_data_flat_file.csv`

If you want to use your own data, you just need to provide a csv in the same format as this file.  

For a very simple example, see `/website/tests/6_nodes_no_errors.csv`

If you want to create some new faked data, use `Data faker (for testing purposes).ipynb`

