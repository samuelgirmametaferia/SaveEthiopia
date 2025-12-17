import express from 'express';
import {serverConfig} from './config.js';


const app = express();

app.get('/', (req,res) =>
{
   
});




app.listen(serverConfig.port, ()=>
{
    console.log(`Server is running at: \nhttp://localhost:${serverConfig.port}`);
});