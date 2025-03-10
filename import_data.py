import pandas as pd
import networkx as nx
from arango import ArangoClient
from adbnx_adapter import ADBNX_Adapter, ADBNX_Controller
from datetime import datetime



def load_crime_data(csv_file_path):
    """Load and preprocess crime data from a CSV file."""
    df = pd.read_csv(csv_file_path, low_memory=False)
    df.columns = [col.strip() for col in df.columns]  # Clean column names
    return df.fillna('Unknown')  # Handle missing values

def create_knowledge_graph(df):
    """Create a MultiDiGraph from crime data with enhanced relationships."""
    G = nx.MultiDiGraph()

    for _, row in df.iterrows():
        # Create unique IDs for each entity
        crime_id = f"Crime_{row['RowID']}"
        location_id = f"Location_{row['Location'].replace(' ', '_')}"
        crime_type_id = f"CrimeType_{row['CrimeCode']}"
        person_id = f"Person_{row['RowID']}"  # Using RowID to make unique persons
        weapon_id = f"Weapon_{row['Weapon']}" if row['Weapon'] else None
        neighborhood_id = f"Neighborhood_{row['Neighborhood']}" if row['Neighborhood'] else "Neighborhood_Unknown"
        district_id = f"District_{row['New_District']}" if row['New_District'] else "District_Unknown"
        premise_id = f"Premise_{row['PremiseType'].strip()}" if row['PremiseType'] else "Premise_Unknown"

        # Parse datetime
        crime_datetime = row['CrimeDateTime']
        try:
            dt_obj = datetime.strptime(crime_datetime, "%m/%d/%Y %I:%M:%S %p")
            hour_of_day = dt_obj.hour
            day_of_week = dt_obj.strftime('%A')
            month = dt_obj.strftime('%B')
            year = dt_obj.year
        except (ValueError, TypeError):
            hour_of_day = None
            day_of_week = None
            month = None
            year = None

        # Add nodes with attributes
        G.add_node(crime_id, type='Crime', datetime=crime_datetime, hour_of_day=hour_of_day, day_of_week=day_of_week, month=month, year=year)
        G.add_node(location_id, type='Location', latitude=row['Latitude'], longitude=row['Longitude'])
        G.add_node(crime_type_id, type='CrimeType', code=row['CrimeCode'], description=row['Description'])
        G.add_node(person_id, type='Person', gender=row['Gender'], age=row['Age'], race=row['Race'], ethnicity=row['Ethnicity'])
        G.add_node(neighborhood_id, type='Neighborhood', name=row['Neighborhood'])
        G.add_node(district_id, type='District', name=row['New_District'])
        G.add_node(premise_id, type='PremiseType', name=row['PremiseType'])

        if weapon_id:
            G.add_node(weapon_id, type='Weapon', name=row['Weapon'])
            G.add_edge(crime_id, weapon_id, relationship='USED')

        # Add edges with relationship types
        G.add_edge(crime_id, location_id, relationship='OCCURRED_AT')
        G.add_edge(crime_id, crime_type_id, relationship='CLASSIFIED_AS')
        G.add_edge(crime_id, person_id, relationship='INVOLVED')
        G.add_edge(location_id, neighborhood_id, relationship='LOCATED_IN')
        G.add_edge(neighborhood_id, district_id, relationship='PART_OF')
        G.add_edge(crime_id, premise_id, relationship='OCCURRED_IN')

    print(f"Created knowledge graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
    return G

class CrimeGraphController(ADBNX_Controller):
    """Custom controller for crime graph translation."""
    def _identify_networkx_node(self, nx_node_id, nx_node, adb_v_cols):
        """Map NetworkX nodes to ArangoDB collections based on type."""
        return nx_node.get('type', 'Unknown')

    def _identify_networkx_edge(self, nx_edge, from_id, to_id, nx_map, adb_e_cols):
        """Map NetworkX edges to ArangoDB collections based on relationship."""
        return nx_edge.get('relationship', 'RELATED_TO')


def main():
    # Load data and create graph
    df = load_crime_data("NIBRS.csv")
    nx_graph = create_knowledge_graph(df)

    # ArangoDB connection
    client = ArangoClient(hosts="http://localhost:8529")
    db = client.db("_system", username="root", password="openSesame")

    # Define edge collections based on relationship types
    edge_definitions = [
        {"edge_collection": "OCCURRED_AT", "from_vertex_collections": ["Crime"], "to_vertex_collections": ["Location"]},
        {"edge_collection": "CLASSIFIED_AS", "from_vertex_collections": ["Crime"], "to_vertex_collections": ["CrimeType"]},
        {"edge_collection": "INVOLVED", "from_vertex_collections": ["Crime"], "to_vertex_collections": ["Person"]},
        {"edge_collection": "LOCATED_IN", "from_vertex_collections": ["Location"], "to_vertex_collections": ["Neighborhood"]},
        {"edge_collection": "PART_OF", "from_vertex_collections": ["Neighborhood"], "to_vertex_collections": ["District"]},
        {"edge_collection": "OCCURRED_IN", "from_vertex_collections": ["Crime"], "to_vertex_collections": ["PremiseType"]},
        {"edge_collection": "USED", "from_vertex_collections": ["Crime"], "to_vertex_collections": ["Weapon"]},
    ]

    # Create adapter and load to ArangoDB
    adapter = ADBNX_Adapter(db, CrimeGraphController())
    adapter.networkx_to_arangodb(
        "CrimeKnowledgeGraph",
        nx_graph,
        edge_definitions=edge_definitions,
        overwrite=True
    )
    print("Crime knowledge graph successfully loaded into ArangoDB.")


if __name__ == "__main__":
    main()