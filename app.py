from spotipy import *
import time
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from bs4 import BeautifulSoup
import requests
import pandas as pd
import re
import os
from tabulate import tabulate
import spotipy.util as util
from itertools import combinations
from dotenv import load_dotenv
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    send_from_directory,
    session,
    redirect,
    url_for,
)
from flask_cors import CORS, cross_origin
from gevent.pywsgi import WSGIServer
import pylast
import logging
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)

load_dotenv()
name = ""
app = Flask(__name__, template_folder="templates/", static_url_path="/static")
CORS(app, supports_credentials=True, origins="*")
app.config["CORS_HEADERS"] = "Content-Type"
app.secret_key = "SOMETHING-RANDOM"
app.jinja_env.auto_reload = True
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SESSION_COOKIE_NAME"] = "spotify-login-session"
LAST_FM_API_KEY = os.environ.get("LAST_FM_API_KEY")
LAST_FM_API_SECRET = os.environ.get("LAST_FM_API_SECRET")
LAST_FM_USERNAME = os.environ.get("LAST_FM_USERNAME")
LAST_FM_PWD_HASH = pylast.md5(os.environ.get("LAST_FM_PWD_HASH"))
network = pylast.LastFMNetwork(
    api_key=LAST_FM_API_KEY,
    api_secret=LAST_FM_API_SECRET,
    username=LAST_FM_USERNAME,
    password_hash=LAST_FM_PWD_HASH,
)


def send_email(subject, body):
    msg = EmailMessage()
    msg.set_content(body)
    msg["Subject"] = subject
    msg["From"] = os.environ.get("EMAIL")
    msg["To"] = os.environ.get("EMAIL")

    try:
        # Connect to the SMTP server and send the email
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(os.environ.get("EMAIL"), os.environ.get("PASS"))
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


# def initialize_lastfm_api():
#     LAST_FM_API_KEY = os.environ.get("LAST_FM_API_KEY")
#     LAST_FM_API_SECRET = os.environ.get("LAST_FM_API_SECRET")
#     LAST_FM_USERNAME = os.environ.get("LAST_FM_USERNAME")
#     LAST_FM_PWD_HASH = pylast.md5(os.environ.get("LAST_FM_PWD_HASH"))
#     network = pylast.LastFMNetwork(
#         api_key=LAST_FM_API_KEY,
#         api_secret=LAST_FM_API_SECRET,
#         username=LAST_FM_USERNAME,
#         password_hash=LAST_FM_PWD_HASH,
#     )
#     return network


def get_songs(artistName):
    try:
        wiki_url = "https://en.wikipedia.org/wiki/{artist}_singles_discography".format(
            artist=artistName.replace(" ", "_")
        )
        response = requests.get(wiki_url)
        response.raise_for_status()

    except requests.exceptions.RequestException as e:
        wiki_url = "https://en.wikipedia.org/wiki/{artist}_discography".format(
            artist=artistName.replace(" ", "_")
        )
        response = requests.get(wiki_url)

        try:
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Failed to fetch data for {artistName}. Error: {str(e)}")
            return []

    print(wiki_url)

    sql = []
    soup = BeautifulSoup(response.text, "html.parser")

    pd.set_option("display.max_columns", 100)
    pd.set_option("display.max_rows", 500)
    pd.set_option("display.min_rows", 500)
    pd.set_option("display.max_colwidth", 150)
    pd.set_option("display.width", 120)
    pd.set_option("expand_frame_repr", True)

    tables = ["As_featured_artist", "Guest_appearances"]
    for table in tables:
        try:
            required_table = (soup.find("span", attrs={"id": table})).find_next("table")
            df = pd.read_html(str(required_table))
            obj = df[0]
            obj = obj.replace(regex="ASAP", value="A$AP")
            obj.columns = [
                col[0] if isinstance(col, tuple) else col for col in obj.columns.values
            ]
            if table == tables[0]:
                for name, album in zip(obj["Title"], obj["Album"]):
                    if name != album:
                        name, remix, artist = re.findall(
                            '^"(.*)"\s*(?:\[.*\])?\s*(\(.*\))?\s*(?:\[.*\])?\s*\((.*)\)',
                            name,
                        )[0]
                        if "featuring" in artist:
                            extra = artist[
                                artist.index("featuring") + len("featuring") :
                            ]
                            artist = artist[: artist.index("featuring")]
                        sql.append([name + " " + remix, artist, album, extra])
            else:
                for name, artist, album in zip(
                    obj["Title"], obj["Other artist(s)"], obj["Album"]
                ):
                    name, remix = re.findall(
                        '^"(.*)"\s*(?:\[.*\])?\s*(\(.*\))?.*', name
                    )[0]
                    sql.append([name + " " + remix, artist, album])
        except Exception as e:
            print(f"Failed to parse table '{table}'. Error: {str(e)}")

    # print(
    #     tabulate(
    #         (row[:3] for row in sql),
    #         headers=["Track", "Artist", "Album"],
    #         tablefmt="pretty",
    #     )
    # ) #dev
    return sql


def create_playlist(track_uris, artistName, username, sp, playlist_id=None):
    try:
        if playlist_id:
            add_tracks_response = sp.playlist_add_items(
                playlist_id=playlist_id, items=track_uris
            )
        else:
            playlist_name = f"ft. {artistName}"
            playlist_description = "A playlist created by a madhaflippin Python script"
            playlist = sp.user_playlist_create(
                username, playlist_name, False, description=playlist_description
            )
            playlist_id = playlist["id"]
            print("Playlist created with ID:", playlist_id)

            add_tracks_response = sp.playlist_add_items(
                playlist_id=playlist_id, items=track_uris
            )

        print(
            f"Playlist created: {sp.playlist(playlist_id)['external_urls']['spotify']}"
        )
        #print("Tracks added to playlist with response:", add_tracks_response) #dev
        return playlist_id, []
    except Exception as e:
        print("Error creating or adding tracks to the playlist:", str(e))
        failed_tracks_uris = []
        if playlist_id:
            failed_tracks_uris = track_uris
        return playlist_id, failed_tracks_uris


def get_track_id(query, sp):
    try:
        results = sp.search(q=query, type="track")
        if results["tracks"]["total"] == 0:
            return None
        else:
            return results["tracks"]["items"][0]["id"]
    except Exception as e:
        print("Error getting track ID:", str(e))
        return None


def get_queries(song, artistName):
    song_name_original = song[0].strip()
    song_name_without_remix = re.sub(
        r"\(remix\)|remix", "", song_name_original, flags=re.IGNORECASE
    ).strip()

    lst = ['artist:"' + song[1].strip() + '"']
    if (
        song[2] != "Non-album singles"
        and song[2] != "Non-album single"
        and (not isinstance(song[2], float))
    ):
        lst += ['album:"' + song[2].strip() + '"']
    queries = []
    for i in range(len(lst), 0, -1):
        comb = combinations(lst, i)
        queries += comb

    queries1 = [['track:"' + song_name_original + '"'] + list(q) for q in queries]
    queries1 += [['track:"' + song_name_without_remix + '"'] + list(q) for q in queries]
    if len(song) == 4:
        queries1 += [
            ['track:"' + song_name_original + song[3].rstrip() + '"'] + list(q)
            for q in queries
        ]
    queries1 += [
        ['track:"' + song_name_original + " " + artistName + '"'] + list(q)
        for q in queries
    ]
    all_queries = queries1
    all_queries += [q for q in queries1 if q not in all_queries]

    ret = []
    for q in all_queries:
        ret += [" ".join([x for x in q])]
    return ret


def get_tracks_from_spotify(songs, artistName, sp):
    try:
        track_uris = []
        for song in songs:
            queries = get_queries(song, artistName)
            # print() #dev
            for query in queries:
                song_id = get_track_id(query, sp)
                # print(query) #dev
                if song_id:
                    track_uris.append(song_id)
                    break
            else:
                pass
                #print(f"No results found for '{song[0]}'") #dev
            #print() #dev
        return track_uris
    except Exception as e:
        print("Error getting tracks from Spotify:", str(e))
        return []


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/form")
def index1():
    return render_template("form.html")


@app.route("/home")
def index2():
    return render_template("home.html")


@app.route("/register", methods=["GET", "POST"])
@cross_origin(origin="localhost", headers=["Content-Type", "Authorization"])
def register():
    if request.method == "POST":
        try:
            data = request.get_json()
            if data is None:
                return (
                    jsonify({"status": "error", "message": "Invalid JSON data."}),
                    400,
                )

            # Collect user input from the JSON data
            username = data.get("username")
            email = data.get("email")
            age = data.get("age")

            if not username or not email or not age:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Incomplete data in the JSON request.",
                        }
                    ),
                    400,
                )

            # print(username)   #dev
            # print(email)  #dev
            # print(age)    #dev

            # Send the form details to the email
            subject = f"{username}'s Registration Form"
            body = f"Username: {username}\nEmail: {email}\nAge: {age}"
            if send_email(subject, body):
                #print("Form details sent to email!")   #dev
                return jsonify(
                    {"status": "success", "message": "Mail sent successfully."}
                )
            else:
                #print("Failed to send email!") #dev
                return jsonify({"status": "error", "message": "Failed to send email."})
        except Exception as e:
            print(f"Error processing the request: {e}")
            return (
                jsonify(
                    {"status": "error", "message": "Error processing the request."}
                ),
                500,
            )

    else:
        return jsonify({"status": "error", "message": "Invalid request method."})


# @app.route("/register", methods=["GET", "POST"])
# def register():
#     if request.method == "POST":
#         # Collect user input from the form
#         username = request.form["username"]
#         email = request.form["email"]
#         age = request.form["age"]
#         print(username)
#         print(email)
#         print(age)

#         # Send the form details to the email
#         subject = "Registration Form Submission"
#         body = f"Username: {username}\nEmail: {email}\nPassword: {age}"
#         if send_email(subject, body):
#             print("Form details sent to email!")
#             return jsonify({"status": "success", "message": "Mail sent successfully."})
#         else:
#             print("Failed to send email!")
#             return jsonify({"status": "error", "message": "Failed to send email."})

#     else:
#         return jsonify({"status": "error", "message": "Invalid request method."})


@app.route("/get_songs", methods=["POST"])
@cross_origin(origin="localhost", headers=["Content-Type", "Authorization"])
def get_songs_route():
    try:
        data = request.get_json()
        artist_name = data["name"]
        global name
        name = artist_name
        sp_oauth = create_spotify_oauth()
        auth_url = sp_oauth.get_authorize_url()
        #print(auth_url) #dev
        # return redirect(auth_url)
        return jsonify(
            {
                "status": "ok",
                "message": "Authenticatin URL received.",
                "auth_url": auth_url,
            }
        )
    except Exception as e:
        app.logger.error(f"Error in /get_songs route: {str(e)}")
        return jsonify({"status": "error", "error_message": str(e)}), 500


def create_spotify_oauth():
    return SpotifyOAuth(
        scope="playlist-modify-private",
        client_id=os.environ.get("SPOTIFY_CLIENT_ID"),
        client_secret=os.environ.get("SPOTIFY_CLIENT_SECRET"),
        redirect_uri=url_for("authorize", _external=True),
        cache_handler=MemoryCacheHandler(),
    )


@app.route("/authorize")
def authorize():
    sp_oauth = create_spotify_oauth()
    session.clear()
    code = request.args.get("code")
    token_info = sp_oauth.get_access_token(code)
    session["token_info"] = token_info
    # return redirect("/get_tracks")

    # Send a message to the parent window indicating that authorization was successful
    return """
        <script>
            window.opener.postMessage("Authorization Successful", "*");
            window.close();
        </script>
        """


def get_token():
    token_valid = False
    token_info = session.get("token_info", {})

    if not session.get("token_info", False):
        token_valid = False
        return token_info, token_valid

    now = int(time.time())
    is_token_expired = session.get("token_info").get("expires_at") - now < 60

    if is_token_expired:
        sp_oauth = create_spotify_oauth()
        token_info = sp_oauth.refresh_access_token(
            session.get("token_info").get("refresh_token")
        )

    token_valid = True
    return token_info, token_valid


def split_into_nested_lists(input_list, max_elements):
    nested_lists = []
    for i in range(0, len(input_list), max_elements):
        nested_lists.append(input_list[i : i + max_elements])
    return nested_lists


@app.route("/get_tracks")
def get_tracks():
    session["token_info"], authorized = get_token()
    session.modified = True
    if not authorized:
        return redirect("/")

    artist_name = name
    songs_data = get_songs(artist_name)
    if songs_data:
        sp = spotipy.Spotify(auth=session.get("token_info").get("access_token"))
        track_uris = get_tracks_from_spotify(songs_data, artist_name, sp)
        if not track_uris:
            return jsonify(
                {"status": "error", "message": "No tracks found for the playlist."}
            )

        user_info = sp.me()
        user_id = user_info["id"]
        #print("Your Spotify username is:", user_id) #dev
        #print("Access token obtained successfully!") #dev

        max_elements_per_list = 100
        track_uri_chunks = split_into_nested_lists(track_uris, max_elements_per_list)

        created_playlist_id = None
        failed_tracks_uris = []

        for track_uris_chunk in track_uri_chunks:
            if not created_playlist_id:
                created_playlist_id, failed_tracks_uris = create_playlist(
                    track_uris_chunk, artist_name, user_id, sp
                )
            else:
                _, new_failed_tracks_uris = create_playlist(
                    track_uris_chunk,
                    artist_name,
                    user_id,
                    sp,
                    playlist_id=created_playlist_id,
                )
                failed_tracks_uris.extend(new_failed_tracks_uris)

        if created_playlist_id:
            if failed_tracks_uris:
                return jsonify(
                    {
                        "status": "partial",
                        "message": "Playlist created with some failed tracks.",
                        "playlist_id": created_playlist_id,
                        "failed_tracks_uris": failed_tracks_uris,
                        "delay_time": 10000,
                    }
                )
            else:
                return jsonify(
                    {
                        "status": "ok",
                        "message": "Playlist created successfully.",
                        "playlist_id": created_playlist_id,
                        "delay_time": 10000,
                    }
                )
        else:
            return jsonify(
                {"status": "error", "message": "Failed to create or update the playlist."}
            )
    else:
        return jsonify(
                {"status": "error", "message": "No features found for the artist."}
            )

@app.route("/search", methods=["GET"])
# @cache.cached(timeout=3600)
def search():
    query = request.args.get("query")
    if query:
        results = network.search_for_artist(query)
        artists = results.get_next_page()
        return jsonify(artists=[a.name for a in artists])
    return jsonify(artists=[])


@app.errorhandler(Exception)
def handle_error(e):
    app.logger.error(f"An error occurred: {str(e)}")
    return jsonify({"status": "error", "error_message": str(e)}), 500


@app.errorhandler(spotipy.SpotifyException)
def handle_spotify_error(e):
    app.logger.error(f"Spotify API error: {str(e)}")
    return jsonify({"status": "error", "error_message": str(e)}), e.http_status


@app.errorhandler(pylast.WSError)
def handle_lastfm_error(e):
    app.logger.error(f"Last.fm API error: {str(e)}")
    return jsonify({"status": "error", "error_message": str(e)}), 500


if __name__ == "__main__":
    #Development
    app.run(debug=True, host="0.0.0.0")
    # #Production
    # # from waitress import serve
    # # serve(app, host="0.0.0.0", port=8080)
    # http_server = WSGIServer(app)
    # http_server.serve_forever()