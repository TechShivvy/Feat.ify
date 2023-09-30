
# Feat.ify

[Feat.ify](https://featify.onrender.com/) is a web application that allows users to create a playlist on Spotify featuring tracks where the given artist is either a featured artist or has been featured in the track. The application makes use of HTML, CSS, JavaScript for the frontend, Flask for the server-side, and Spotipy for working with the Spotify Web API.


## Tech Stack

**Client:** HTML,CSS,JS

**Server:** Flask


## Features

- **Interactive & Friendly UI**: The frontend of the application is designed to be user-friendly and easy to navigate.

-  **Scraping with Beautiful Soup** : Feat.ify employs web scraping to extract data from Wikipedia, making it possible to fetch detailed information about the artist's discography and collaborations.

- **Data Parsing with Pandas**: The use of Pandas library ensures efficient parsing and organization of the data extracted from Wikipedia tables.

- **Spotify OAuth Integration**: Secure login with Spotify credentials using OAuth grants necessary permissions to manage playlists.

- **Spotify Web API**: Utilizes Spotipy to create and manage playlists directly on the user's Spotify account.

- **Playlist Creation**: Allows users to create personalized playlists featuring their favorite artists' collaborations.

- **Robust Error Handling**: Gracefully handles unexpected situations and provides helpful error messages to users.



## How it works

1. Last.fm is used for search suggestions and to extract user information.
2. The application finds the Wikipedia URL for the selected artist based on user input.
3. It extracts two tables from the Wikipedia page using Beautiful Soup.
4. The data is then parsed and necessary information is stored in a structured format.
5. The user is authenticated with Spotify using OAuth to gain necessary permissions.
6. Using the artist information obtained, the application searches for songs on Spotify and retrieves their unique track IDs.
7. The track IDs are then used to create a new playlist on the user's Spotify account.
8. Finally, the newly created playlist is returned to the user, featuring collaborations with the selected artist.
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`SPOTIFY_CLIENT_ID`
`SPOTIFY_CLIENT_SECRET`
`SPOTIPY_REDIRECT_URI`
`SPOTIFY_SCOPE`

`LAST_FM_API_KEY`
`LAST_FM_API_SECRET`
`LAST_FM_USERNAME`
`LAST_FM_PWD_HASH`

## Run Locally

Clone the project

```bash
  git clone https://github.com/TechShivvy/Feat.ify.git
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  pip install -r requirements.txt
```

Start the server(don't forget to set env variables)

```bash
  python app.py
```

Access the site at(port 5000 is default)

```bash
  http://localhost:5000
```



## Spotify and Last.fm API 

#### Create Spotify and Last.fm API Keys

Users must go to the respective websites for Spotify and Last.fm developers to create API keys. These API keys are required to access the Spotify and Last.fm APIs.

#### Set Environment Variables
After obtaining the API keys, users need to set up environment variables in the application. These environment variables should include the API keys and other required credentials, such as the redirect URL for Spotify OAuth. The .env file or system environment variables should be used to store these values securely.

#### Authorize Spotify API Redirect URL
When creating the Spotify API key, users must specify the redirect URL. This URL should point to the Feat.ify application's authorization route (/authorize in this case). This is necessary for the OAuth flow to work correctly, allowing users to log in and grant necessary permissions to the application.


## Website
You can try out our website at [featify.onrender.com](https://featify.onrender.com/) _takes few mins to load,sorry :p_
## Authors

- [@Hitesh](https://github.com/Hitesh1090)
- [@TechShivvy](https://github.com/TechShivvy)





## Feedback

If you have any feedback, please fill out this [form](https://forms.gle/7y3YAAvN5D9ngK2U6).

