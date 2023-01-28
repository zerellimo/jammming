const clientId = 'b5a320596ff140ae90d2b99804889530';
const redirectURI = 'https://zerellimo-jam.surge.sh';
let accessToken;

const Spotify = {
    getAccessToken(){
        if(accessToken) {
            return accessToken;
        }

        // check for access token match
        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
        if(accessTokenMatch && expiresInMatch) {
            accessToken = accessTokenMatch[1]; // using [1] because .match returns an array
            const expiresIn = Number(expiresInMatch[1]); // converting to number to use later
            // clear the parameters when the access token expires
            window.setTimeout(() => accessToken = '', expiresIn * 1000);
            window.history.pushState('Access Token', null, '/');
            return accessToken;
        } else {
            const accessURL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
            window.location = accessURL;
        }
    },

    search(term) {
        const accessToken = Spotify.getAccessToken();
        return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }).then(response => {
            return response.json();
        }).then(jsonResponse => {
            if(!jsonResponse) {
                return [];
            }
            return jsonResponse.tracks.items.map(track=> ({
                id: track.id,
                name: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri
            }));
        });
    },

    savePlaylist(playlistName, trackURIs){
        
        if(!playlistName || !trackURIs.length) {
            return;
        }
        
        const accessToken = Spotify.getAccessToken();
        const headers = {Authorization: `Bearer ${accessToken}`};
        let userID;
        
        return fetch(`https://api.spotify.com/v1/me`, {headers: headers}
        ).then(response=> response.json()
        ).then(jsonResponse=> {
            userID = jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, 
            {
                headers: headers,
                method: 'POST',
                body: JSON.stringify({name: playlistName})
            }).then(response=> response.json()
            ).then(jsonResponse=>{
                const playlistID = jsonResponse.id;
                return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, 
                {
                    headers: headers,
                    method: 'POST',
                    body: JSON.stringify({uris: trackURIs})
                });
            });
        });

    }
}

export default Spotify;