import { Request, Response } from 'express';
import WebConfig from '../WebConfig';
import axios, { AxiosResponse } from 'axios';

export class Routes {

    redirectURI: string;
    spotifyScopes: string;
    token: string;
    state: string;

    constructor() {
        this.redirectURI = 'http://localhost:3000/redirected';
        this.token = '';
        this.state = this.StateGen();
    }

    private StateGen = (): string => {
        let state: string = '';
        let chars: string = 'abcdefghijklmnopqrstuvwxyz0123456789';
        while (state.length < 10) {
            state += chars.charAt(Math.floor(Math.random() * (chars.length - 1)));
        }
        return state;
    }

    public routes = (app): void => {
        app.route('/')
        .get((req: Request, res: Response) => {
            res.status(200).send({
                messaage: 'GET request Successful my dude!'
            });
        })

        app.route('/login')
        .get((req: Request, res: Response) => {
            res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${WebConfig.SpotifyClientId}&redirect_uri=${encodeURIComponent(this.redirectURI)}&state=${this.state}`);
        })

        app.route('/redirected')
        .get((req: Request, res: Response) => {
            let authorization = "Basic " + Buffer.from(WebConfig.SpotifyClientId + ":" + WebConfig.SpotifySecret).toString('base64');
            let bodyString = "grant_type=authorization_code&redirect_uri=" + this.redirectURI + "&code=" + req.query.code;
            if (req.query.state == this.state) {
                axios({
                    method: 'POST',
                    url: 'https://accounts.spotify.com/api/token',
                    headers: {
                        "Authorization": authorization,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data: bodyString
                })
                .then((response: AxiosResponse) => {
                    if (response.status == 400) {
                        console.log("uh oh");
                    }
                    this.token = response.data.access_token;
                    res.redirect('/loggedin');
                })   
            }  
            else {
                res.status(400);
                res.send("There was an error validating your request");
            }       
        });

        app.route('/loggedin')
        .get((req: Request, res: Response) => {
            console.log(this.token);
            axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    "Authorization": "Bearer " + this.token
                }
            })
            .then(response => {
                // console.log(response);
                res.send( { data: response.data} );
            })
        })

        app.route('/playlists')
        .get((req: Request, res: Response) => {
            console.log(this.token);
            axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    "Authorization": "Bearer " + this.token
                }
            })
            .then((response: AxiosResponse) => {
                res.send( { data: response.data} );
            })
        })

        //my userid: 1298920342
        //big playlist id: 4s26grp0g03iAJfWgUOwZF

        app.route('/myplaylist')
        .get((req: Request, res: Response) => {
            console.log(this.token);
            axios.get('https://api.spotify.com/v1/users/1298920342/playlists/4s26grp0g03iAJfWgUOwZF/tracks', {
                headers: {
                    "Authorization": "Bearer " + this.token
                }
            })
            .then((response: AxiosResponse) => {
                res.send( { data: response.data} );
            })
        })
    } 
}