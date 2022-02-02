import axios from 'axios';
import shell from 'shelljs';
const pm2 = require('pm2');

import { endPointDesEnum , endPointProdEnum} from '../src/enum/EndPointEnum';
const endPoint = (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' ? endPointProdEnum : endPointDesEnum)

let jobsStart: any[] = [];

init();

async function init(){

    try {   
        shell.exec('certbot renew --dry-run --quiet');    
    } catch (error) {
        
    }

    notificar("Start")

    await definirHorariosProcessamento();
    startAutomatico()
    verificaProcesso();

    do{
        //restartAgendado();
       
        try {        
            for (const key in jobsStart) {

                if(jobsStart[key].ativo){

                    let horarios = jobsStart[key].horarios.split(',');
                    for (const keyH in horarios) {
                        if(compararHora(horarios[keyH])){
                            executar(jobsStart[key].endPoint, horarios[keyH])
                        }
                    }
                }

                
            }
        } catch (error) {
                
        }
        
        await sleep(1000)

    }while(true);

}

async function startAutomatico(){
    
    try {  
        if(process.env.NODE_ENV === 'test' ){
            return (0)
        }      
        try {
            
            const url = `${endPoint.urlServidorOrquestrador}/processar`
            await sleep(60000) //1 minutos de intervalo a cada solicitação 
            do{
                
                try {
                    await axios.get(url);  
                    await sleep(1000 * 30) //1 minutos de intervalo a cada solicitação 
                } catch (error) {
                        
                }
                
            }while(true)
            
        } catch (error) {
            console.log(error)   
        }
        
    } catch (error) {
            
    }

}

async function executar(url: string, horario: string){
    try {
        notificar(url)
        await axios.get(url);  
    } catch (error) {
        console.log(error)        
    }
}

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 


// Verifica se hora1 é maior que hora2.
function compararHora(hora)
{
    hora = hora.split(":");
    let segundos: any = "00"
    
    var d = new Date();
    var data1 = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
    var data2 = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hora[0], hora[1], segundos);

    return (data1.toTimeString() === data2.toTimeString());
};

function definirHorariosRandomicos(conjuntoHorario: any[]): string{
 
    let minutos = ['00', '01', '02', '03', '04','05', '06', '07', '08', '09', '10', '11', '12',,'13', '14', '15', '16', '17', '18', '19', '20',
    '21','22', '23','24', '25', '26', '27','28', '29', '30', '31', '32', '33', '34', '35', '36','37', '38', '39', '40', '41', '42', '43','44', 
    '45', '46', '47','48','49','50','51', '52', '53', '54', '55', '56','57','58','59']

    let horaDefinida = `${conjuntoHorario[Math.floor(Math.random() * conjuntoHorario.length)]}:${minutos[Math.floor(Math.random() * minutos.length)]}`

    return horaDefinida;
}

async function definirHorariosProcessamento() {

    jobsStart = [];

        //WATSAPP
        jobsStart.push({
            endPoint :  `${endPoint.urlServidorOrquestrador}/processarWhatsApp`,  
            ativo: true,
            horarios : '07:10,09:10,10:00,12:10,14:10,16:10,18:10,20:10,22:10'
        });

        //TELEGRAM
        jobsStart.push({
            endPoint :  `${endPoint.urlServidorOrquestrador}/processarTelegram`,  
            ativo: true,
            horarios : '07:10,09:10,10:00,12:10,14:10,16:10,18:10,20:10,22:10'
        });

        //LOMADEE
        /*jobsStart.push({
            endPoint :  `${endPoint.urlServidorLomadee}/lojas`,  
            ativo: true,
            horarios :'00:30'
        });
    
        jobsStart.push({
            endPoint :  `${endPoint.urlServidorLomadee}/categorias`,  
            ativo: true,
            horarios :'00:30'
        });
    
        jobsStart.push({
            endPoint :  `${endPoint.urlServidorLomadee}/cupons`,  
            ativo: true,
            horarios : '04:50,09:00,10:00,11:00,12:05,16:00,17:00,18:00,22:00,23:00,00:00'
        });*/
    
        //FACBOOCK
        jobsStart.push({
            endPoint :  `${endPoint.urlServidorOrquestrador}/processarFacboock`,  
            ativo: true,
            horarios : `${definirHorariosRandomicos(['05','06', '07', '08', '09', '10'])},
            ${definirHorariosRandomicos(['11','13', '14', '15', '16'])},
            ${definirHorariosRandomicos(['17','18', '19', '20', '21', '22', '23'])}
        `
        });
        
        jobsStart.push({
            endPoint :  `${endPoint.urlServidorInstagram}/seguidores`,
            ativo: true,
            horarios : `${definirHorariosRandomicos(['05','06', '07', '08'])},
                        ${definirHorariosRandomicos(['09', '10', '11', '13'])},
                        ${definirHorariosRandomicos(['14', '15', '16','17','18'])},
                        ${definirHorariosRandomicos(['19', '20', '21', '22', '23'])},
                    `    
        });
        
        jobsStart.push({
            endPoint :  `${endPoint.urlServidorOrquestrador}/processarInstagram`,  
            ativo: true,
            horarios : `${definirHorariosRandomicos(['05','06', '07', '08', '09', '10'])},
                        ${definirHorariosRandomicos(['11', '13', '14', '15', '16'])},
                        ${definirHorariosRandomicos(['17','18', '19', '20', '21', '22', '23'])}
                    `
        });
}


async function notificar(mensagem: any){
    try {
        axios.get(`${endPoint.urlServidorTelegram}/notifica`, {
            params: {
                mensagem: `Start Crow - ${mensagem}`
            }
        })
    } catch (error) {
        
    }

}



async function verificaProcesso() {

    do{
        try {
            
            await pm2.connect(function(err: any) {

                    pm2.list(async (err: any, list: any) => {
                    for (const key in list) {
                        if(list[key].pm2_env.status !== 'online'){

                            notificar(`PM2 - ${list[key].name}: ${list[key].pm2_env.status}`)
                            
                        }
                        
                    }
                })
            });
            
            await sleep(10000000)
        } catch (error) {
                
        }

    }while(true)
}
