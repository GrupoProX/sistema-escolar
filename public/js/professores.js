
var secretariaRef = firebase.database().ref('sistemaEscolar/secretaria')
var numerosRef = firebase.database().ref('sistemaEscolar/numeros')
var aniversariosRef = firebase.database().ref('sistemaEscolar/aniversarios')
var listaDeUsuariosRef = firebase.database().ref('sistemaEscolar/listaDeUsuarios')
var listaDeProfessores = firebase.database().ref('sistemaEscolar/listaDeProfessores')
var turmasRef = firebase.database().ref('sistemaEscolar/turmas')
var ultimaMatriculaRef = firebase.database().ref('sistemaEscolar/ultimaMatricula')
var alunosRef = firebase.database().ref('sistemaEscolar/alunos')
var followUpRef = firebase.database().ref('sistemaEscolar/followUp')
var transfereAlunos = firebase.functions().httpsCallable('transfereAlunos')
var usuarioRef = firebase.database().ref('sistemaEscolar/usuarios')

var loader = document.getElementById('loader')
var loaderMsg = document.getElementById('loaderMsg')

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })

  $(function () {
    $('[data-toggle="popover"]').popover()
  })
var turmasProf
var alunos = {}
firebase.auth().onAuthStateChanged((user) => {
    update()
    if (user == null) {
        loader.style.display = 'none'
        AstNotif.dialog('Login não identificado', 'Você não está logado, vá para a tela de <a href="../login.html">login</a> para logar ou se cadastrar.')
    } else {
        usuarioRef.child(user.uid).once('value').then(snapshot => {
            let dadosUser = snapshot.val()
            let listaAlunosMat = []
            
            if (dadosUser.professor != undefined) {
                turmasProf = dadosUser.professor.turmas
                for (const turma in turmasProf) {
                    if (Object.hasOwnProperty.call(turmasProf, turma)) {
                        const bool = turmasProf[turma];
                        if (bool) {
                            document.getElementById('listaTurmasProf').innerHTML += `<button class="list-group-item list-group-item-action" onclick="document.getElementById('btnAbaTurmas').click(),abreTurma('${turma}')">Turma ${turma}</button>`
                            turmasRef.child(turma + '/alunos').once('value').then(matAlunos => {
                                for (const matricula in matAlunos.val()) {
                                    if (Object.hasOwnProperty.call(matAlunos.val(), matricula)) {
                                        listaAlunosMat.push(matricula)
                                        console.log(matricula)
                                    }
                                }
                                for (const i in listaAlunosMat) {
                                    if (Object.hasOwnProperty.call(listaAlunosMat, i)) {
                                        const aluno = listaAlunosMat[i];
                                        alunosRef.child(aluno).once('value').then(dadosAluno => {
                                            alunos[aluno] = dadosAluno.val()
                                            
                                        }).catch(error => {
                                            AstNotif.dialog("Erro", error.message)
                                        })
                                        
                                    }
                                }
                            }).catch(error => {
                                AstNotif.dialog('Erro', error.message)
                                console.log(error)
                            })
                        }
                    }
                }
                
            }
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        loader.style.display = 'block'
        loaderMsg.innerText = 'Buscando informações do usuário...'
        try {
            if (user.photoURL != null) {
                document.getElementById('profilePic').src = user.photoURL
                document.getElementById('username').innerHTML = "Olá,<br>" + user.displayName.split(' ')[0]
            } 
        } catch (error) {
            console.log(error)
        }

        aniversariosRef.on('value', snapshot => {
            loader.style.display = 'block'
            var meses = snapshot.val()
            var dataLocal = new Date()
            var mesAtual = dataLocal.getMonth()
            document.getElementById('listaAniversarios').innerHTML = ''
            for (const key in meses[mesAtual]) {
                if (meses[mesAtual].hasOwnProperty(key)) {
                    const aniversario = meses[mesAtual][key];
                    document.getElementById('listaAniversarios').innerHTML += `<button class="list-group-item list-group-item-action">${aniversario.nome} no dia ${aniversario.dataNascimento.dia}</button>`
                }
            }
            loader.style.display = 'none'
        })
    }
    
})

function carregaListaDeAlunos(filtro='') {
    console.log(filtro)
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando lista de alunos...'
    let listaAlunos = document.getElementById('listaAlunos')
    if (filtro == '') {
        document.getElementById('listaAlunos').innerHTML = ''
        for (const matricula in alunos) {
            if (Object.hasOwnProperty.call(alunos, matricula)) {
                const aluno = alunos[matricula];
                document.getElementById('listaAlunos').innerHTML += `<button class="list-group-item list-group-item-action" onclick="abreDadosDoAluno('${matricula}')">${matricula}: ${aluno.nomeAluno} (${aluno.turmaAluno})</button>`
            }
        }
        loader.style.display = 'none'
    } else {
        
    }
    
}

var turmas
// Funções da aba de turmas dos professores
function carregaTurmas() {
    alunosSelecionadosTurma = {}
    document.getElementById("areaInfoTurma").style.visibility = 'hidden'
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando informações das turmas...'
    var selectTurmas = document.getElementById('selectTurmas')
    selectTurmas.innerHTML = ''
    for (const turma in turmasProf) {
        if (Object.hasOwnProperty.call(turmasProf, turma)) {
            const bool = turmasProf[turma];
            if (bool) {
                turmasRef.child(turma).once('value').then(snapshot => {
                    selectTurmas.innerHTML += '<option selected hidden>Escolha uma turma...</option>'
                    let infoDaTurma = snapshot.val()
                    if (infoDaTurma.professor == undefined) {
                        var profReferencia = 'Não cadastrado'
                    } else {
                        var profReferencia = infoDaTurma.professor[0].nome
                    }
                    selectTurmas.innerHTML += `<option value="${snapshot.key}">Turma ${snapshot.key} (Prof. ${profReferencia})</option>`
                    document.getElementById('selectTurmas').style.visibility = 'visible'
                    loader.style.display = 'none'
                }).catch(error => {
                    loader.style.display = 'none'
                    console.error(error)
                    AstNotif.dialog('Erro', error.message)
                })
            }
        }
    }
    
}

var alunosSelecionadosTurma = {}


function carregaListaDeAlunosDaTurma(turma, filtro='') {
    
    tipoDeBusca = 'nome'
    alunosSelecionadosTurma = {}
    alunosSelecionadosTurma.codTurma = turma
    console.log(filtro)
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando lista de alunos...'
    let listaAlunos = document.getElementById('listaAlunos')
    if (filtro == '') {
        document.getElementById('listaAlunosDaTurma').innerHTML = ''
        turmasRef.child(turma + '/alunos').once('value').then(snapshot => {
            let alunosTurma = snapshot.val()
            for (const matricula in alunosTurma) {
                if (Object.hasOwnProperty.call(alunosTurma, matricula)) {
                    const aluno = alunosTurma[matricula];
                    document.getElementById('listaAlunosDaTurma').innerHTML += `<div class="row"><div class="col-1" ><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="checkbox" name="alunosTurma" onclick="this.checked ? alunosSelecionadosTurma[${matricula}] = '${aluno.nome}' : delete alunosSelecionadosTurma[${matricula}], verificaAlunosSelecionados()"></div><div class="col-md"><button class="list-group-item list-group-item-action" onclick="document.getElementById('btnAbaAlunos').click(), document.getElementById('btnAbaAlunosResponsivo').click(), abreDadosDoAluno('${matricula}'), setTimeout( function() {document.getElementById('rolaTelaAbaixoAlunos').style.display = 'block', document.getElementById('rolaTelaAbaixoAlunos').focus(), document.getElementById('rolaTelaAbaixoAlunos').style.display = 'none'}, 300 ); "> ${matricula}: ${aluno.nome}</button></div></div>`
                }
                
            }
            loader.style.display = 'none'
        }).catch(error => {
            console.log(error)
            AstNotif.dialog('Erro', error.message)
        })
    } else {
        document.getElementById('listaAlunosDaTurma').innerHTML = ''
        turmasRef.child(turma + '/alunos').orderByChild('nome').equalTo(filtro).once('value').then(snapshot => {
            let alunosTurma = snapshot.val()
            for (const matricula in alunosTurma) {
                if (Object.hasOwnProperty.call(alunosTurma, matricula)) {
                    const aluno = alunosTurma[matricula];
                    document.getElementById('listaAlunosDaTurma').innerHTML += `<div class="row"><div class="col-sm-1"><input type="checkbox" name="alunosTurma" onclick="this.checked ? alunosSelecionadosTurma[${matricula}] = '${aluno.nome}' : delete alunosSelecionadosTurma[${matricula}], verificaAlunosSelecionados()"></div><div class="col-md"><button class="list-group-item list-group-item-action" onclick="document.getElementById('btnAbaAlunos').click(), document.getElementById('btnAbaAlunosResponsivo').click(), abreDadosDoAluno('${matricula}') "> ${matricula}: ${aluno.nome}</button></div></div>`
                }
            }
            loader.style.display = 'none'
        }).catch(error => {
            console.log(error)
            AstNotif.dialog('Erro', error.message)
        })
    }

    turmasRef.child(turma + '/status').once('value').then(snapshot => {
        let status = snapshot.val()
        if (snapshot.exists()) {
            if (status.turma == 'aberta') {
                document.getElementById('infoTurma').style.color = 'green'
                document.getElementById('infoTurma').innerText = 'Turma Aberta'
                document.getElementById('btnIniciaPeriodo').style.visibility = 'visible'
                document.getElementById('btnFechaPeriodo').style.visibility = 'visible'
                document.getElementById('btnIniciaPeriodo').disabled = true
                document.getElementById('btnFechaPeriodo').disabled = false
                document.getElementById('btnLancaFrequencia').style.visibility = 'visible'
                document.getElementById('btnLancaNotas').style.visibility = 'visible'
            } else {
                document.getElementById('btnLancaFrequencia').style.visibility = 'hidden'
                document.getElementById('btnLancaNotas').style.visibility = 'hidden'
                document.getElementById('btnIniciaPeriodo').style.visibility = 'hidden'
                document.getElementById('infoTurma').style.color = 'yellow'
                document.getElementById('infoTurma').innerText = 'Turma Fechada'
                document.getElementById('btnIniciaPeriodo').style.visibility = 'visible'
                document.getElementById('btnFechaPeriodo').style.visibility = 'visible'
                document.getElementById('btnIniciaPeriodo').disabled = false
                document.getElementById('btnFechaPeriodo').disabled = true
            }
        } else {
            document.getElementById('btnLancaFrequencia').style.visibility = 'hidden'
            document.getElementById('btnLancaNotas').style.visibility = 'hidden'
            document.getElementById('btnFechaPeriodo').style.visibility = 'hidden'
            document.getElementById('btnIniciaPeriodo').disabled = false
            document.getElementById('infoTurma').innerText = 'Turma'
            document.getElementById('infoTurma').style.color = 'black'
        }
        
    }).catch(error => {
        console.log(error)
        AstNotif.dialog('Erro', error.message)
    })
    
}

function iniciaPeriodo(confirma=false, inicio='', fim='') {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Iniciando turma...'
        turmasRef.child(alunosSelecionadosTurma.codTurma + '/status').set({turma: 'aberta', inicio: inicio, fim: fim}).then(()=>{
            $('#modal').modal('hide')
            AstNotif.notify('Sucesso', 'Turma aberta')
            carregaListaDeAlunosDaTurma(alunosSelecionadosTurma.codTurma)
            loader.style.display = 'none'
        }).catch(error => {
            loader.style.display = 'none'
            console.log(error)
            AstNotif.dialog('Erro', error.message)
        })
    } else {
        abrirModal('modal', 'Confirmação de abertura da turma ' + alunosSelecionadosTurma.codTurma, `
            Atenção. Você está prestes a iniciar as ativiadades da turma ${alunosSelecionadosTurma.codTurma}. Ao iniciar a turma, você poderá lançar notas e frequências para os alunos que estão cadastrados na turma.<br>
            <br>
            <b>Escolha uma data de início e um data com o fim previsto deste semestre, bimestre, ano...</b> (Essas datas não farão com que o sistema abra ou feche as turmas automaticamente. Um professor cadastrado na turma é quem deve iniciar e fechar a turma manualmente)<br>
            Início previsto:
            <input type="date" class="form-control" name="dataInicioPeriodo" id="dataInicioPeriodo">
            <br> Fim previsto:
            <input type="date" class="form-control" name="dataFimPeriodo" id="dataFimPeriodo">

        `, 
        `<button type="button" data-toggle="tooltip" data-placement="top" title="Iniciar atividades da turma no sistema" class="btn btn-primary" onclick="iniciaPeriodo(true, document.getElementById('dataInicioPeriodo').value, document.getElementById('dataFimPeriodo').value)">Iniciar turma</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`)
    }
}

function verificaAlunosSelecionados() {
    let c = 0
    for (const matricula in alunosSelecionadosTurma) {
        if (Object.hasOwnProperty.call(alunosSelecionadosTurma, matricula)) {
            const nome = alunosSelecionadosTurma[matricula];
            
            if (matricula == 'codTurma') {
                
            } else if (nome != "") {
                c++
            }
            console.log(c)
            if (c == 0) {
                document.getElementById('btnLancaFrequencia').disabled = true
                document.getElementById('btnLancaNotas').disabled = true
                document.getElementById('selecTodos').checked = false
            } else {
                document.getElementById('btnLancaFrequencia').disabled = false
                document.getElementById('btnLancaNotas').disabled = false
            }
        }
    }
    
}



var contadorDeNotas
function lancaNotas(confirma=false) {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Lançando notas dos alunos no sistema...'
        var notasParaLancar = {}
        let c2 = 0
        while (c2 < contadorDeNotas) {
            let index = document.getElementById('nomeNota' + c2).value
            let valor = Number(document.getElementById('valorNota' + c2).value)
            notasParaLancar[index] = valor
            c2++
        }
        var alunosSelec = Object.assign({}, alunosSelecionadosTurma)
        delete alunosSelec.codTurma
        var lancarNotas = firebase.functions().httpsCallable('lancarNotas')
        console.log(alunosSelecionadosTurma)
        console.log(alunosSelec)
        console.log({alunos: alunosSelec, turma: alunosSelecionadosTurma.codTurma, notas: notasParaLancar})
        lancarNotas({alunos: alunosSelec, turma: alunosSelecionadosTurma.codTurma, notas: notasParaLancar}).then(function(result){
            AstNotif.notify('Sucesso', result.data.answer)
            $('#modal').modal('hide')
            loader.style.display = 'none'
        }).catch(function(error){
            loader.style.display = 'none'
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
    } else {
        let nomes = ''
        let turma
        for (const matricula in alunosSelecionadosTurma) {
            if (Object.hasOwnProperty.call(alunosSelecionadosTurma, matricula)) {
                const aluno = alunosSelecionadosTurma[matricula];
                if (matricula == 'codTurma') {
                    turma = aluno
                } else if(matricula == undefined || aluno == undefined) {

                } else {
                    nomes += formataNumMatricula(matricula) + ': ' + aluno + '<br>'
                }
                
            }
        }
        abrirModal('modal', 'Lançamento de notas', 
            `Você selecionou os alunos listados abaixo da turma ${turma}. <br> ${nomes} <br><b>Digite os valores nas notas que deseja lançar:</b><br>
            <section id="camposLancaNotas"></section>
            `
            , `<button type="button" data-toggle="tooltip" data-placement="top" title="Lançar notas para os alunos selecionados" class="btn btn-primary" onclick="lancaNotas(true)">Lançar</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
        )
        turmasRef.child(alunosSelecionadosTurma.codTurma + '/notas').once('value').then(snapshot => {
            let notas = snapshot.val()
            if (notas != null) {
                notasDistribuidas = notas
            } else {
                AstNotif.dialog('Espera aí', 'Você não distribuiu notas nesta turma. Volte na turma e clique em "Distribuir notas".')
            }
            
            console.log(notas)
            let c = 0
            for (const nomeNota in notas) {
                if (Object.hasOwnProperty.call(notas, nomeNota)) {
                    const valor = notas[nomeNota];
                    document.getElementById('camposLancaNotas').innerHTML += `
                    <div class="row" id="linha${c}">
                        <div class="col-2" >
                            <input type="text" class="form-control" id="nomeNota${c}" placeholder="EX ${c + 1}" value="${nomeNota}" readonly>
                        </div>
                        <div class="col-2">
                            Total: ${valor}
                        </div>
                        <div class="col-2">
                            
                            <input type="number" min="0" max="${valor}" id="valorNota${c}" value="0" class="form-control"  placeholder="Total: ${valor}" onkeyup='this.value > ${valor} || this.value == "" ? this.value = 0: console.log("ok")'>
                        </div>
                        <button type="button" class="btn btn-light btn-sm" onclick="document.getElementById('valorNota${c}').value = ${valor}">Dar Total</button><br>
                    </div>
                    `
                    c++
                }
            }
            contadorDeNotas = c
            let aluno = Object.assign({}, alunosSelecionadosTurma)
            delete aluno.codTurma
            console.log(aluno)
            let c3 = 0
            for (const matricula in aluno) {
                if (Object.hasOwnProperty.call(aluno, matricula)) {
                    aluno = matricula
                    
                }
                c3++
                console.log(c3)
            }
            console.log(c3)
            if (c3 == 1) {
                var c4 = 0
                turmasRef.child(alunosSelecionadosTurma.codTurma + '/alunos/' + formataNumMatricula(aluno) + '/notas').once('value').then(snapshot => {
                    let notasDoAluno = snapshot.val()
                    console.log(snapshot.val())
                    for (const nomeNota in notasDoAluno) {
                        if (Object.hasOwnProperty.call(notasDoAluno, nomeNota)) {
                            const valor = notasDoAluno[nomeNota];
                            console.log(valor)
                            console.log(c4)
                            document.getElementById('valorNota' + c4).value = valor
                            c4++
                        }
                    }
                    
                }).catch(error => {
                    loader.style.display = 'none'
                    AstNotif.dialog('Erro', error.message)
                    console.log(error)
                })
            }
            feather.replace()
        }).catch(error => {
            loader.style.display = 'none'
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
        let selectTurmasTransfere = document.getElementById('selectTurmasTransfere')
        for (const cod in turmas) {
            if (Object.hasOwnProperty.call(turmas, cod)) {
                const infoDaTurma = turmas[cod];
                if (infoDaTurma.professor == undefined) {
                    var profReferencia = 'Não cadastrado'
                } else {
                    var profReferencia = infoDaTurma.professor[0].nome
                }
                selectTurmasTransfere.innerHTML += `<option value="${cod}">Turma ${cod} (Prof. ${profReferencia})</option>`
            }
        }
    }
        
}

function distribuiNotas() {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Buscando notas...'
    abrirModal('modal', 'Distribuição de notas da turma ' + alunosSelecionadosTurma.codTurma, 
            `Distribua os tipos de notas que você aplicará em sala de aula<br>
            
            <button type="button" data-toggle="tooltip" data-placement="top" title="Adicionar nota" class="btn btn-light btn-sm" onclick="addCampoNota()"><span data-feather="plus-square"></span></button><br>
            <div class="row"><div class="col-2"><label>Nota</label></div><div class="col-2"><label>Valor</label></div></div>
            <section id="camposNotas"></section>
            <br>
            Total: <label id="somaNotasDistribuidas"></label>/100.0
            `
            , `<button type="button" data-toggle="tooltip" data-placement="top" title="Essas serão as notas que você deverá distribuir durante o período. Você pode alterar as distribuição de notas depois." class="btn btn-primary" onclick="defineNotas()">Definir notas</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
        )
        feather.replace()
        contadorNotas = 0
        contadorNotasExtras = 0
        notasDistribuidas = {}
        somatorioDistribuidas = 0
        turmasRef.child(alunosSelecionadosTurma.codTurma + '/notas').once('value').then(snapshot => {
            
            let notas = snapshot.val()
            if (notas != null) {
                notasDistribuidas = notas
            }
            
            console.log(notas)
            let c = 0
            for (const nomeNota in notas) {
                if (Object.hasOwnProperty.call(notas, nomeNota)) {
                    const valor = notas[nomeNota];
                    document.getElementById('camposNotas').innerHTML += `
                    <div class="row" id="linha${c}">
                        <div class="col-2" >
                            <input type="text" class="form-control" id="nomeNota${c}" placeholder="EX ${c + 1}" value="${nomeNota}">
                        </div>
                        <div class="col-2">
                            <input type="number" id="valorNota${c}" class="form-control" value="${valor}" onkeyup="somaNotasDistribuidas('${c}')" placeholder="15.5">
                        </div>
                        <button type="button" class="btn btn-light btn-sm" onclick="somaNotasDistribuidas('${c}', true), document.getElementById('linha${c}').remove(), contadorNotas--"><span data-feather="x-square"></span></button><br>
                    </div>
                    `
                    somaNotasDistribuidas(c)
                    c++
                }
            }
            contadorNotas = c
            feather.replace()
           

            loader.style.display = 'none'
        }).catch(error => {
            loader.style.display = 'none'
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
        
}



var contadorNotas = 0
var contadorNotasExtras = 0
function addCampoNota(extra=false) {
    let camposNotas = document.getElementById('camposNotas')
    document.getElementById('somaNotasDistribuidas').innerText = 0
    
    if (extra) {
        
    } else {
        camposNotas.innerHTML += 
        `
        <div class="row" id="linha${contadorNotas}">
            <div class="col-2" >
                <input type="text" class="form-control" id="nomeNota${contadorNotas}" placeholder="EX ${contadorNotas + 1}" value="EX ${contadorNotas + 1}">
            </div>
            <div class="col-2">
                <input type="number" id="valorNota${contadorNotas}" class="form-control" onkeyup="somaNotasDistribuidas('${contadorNotas}')" placeholder="15.5">
            </div>
            <button type="button" class="btn btn-light btn-sm" onclick="somaNotasDistribuidas('${contadorNotas}', true), document.getElementById('linha${contadorNotas}').remove(), contadorNotas--"><span data-feather="x-square"></span></button><br>
        </div>
        `
        feather.replace()
        contadorNotas++
    }
}
var notasDistribuidas = {}
var somatorioDistribuidas = 0

function defineNotas() {
    if (somatorioDistribuidas >  100) {
        AstNotif.dialog('Atenção', 'O somatório das notas ultrapassou 100 pontos. Por favor, faça ajustes na distribuição para que não passe de 100 pontos.')
    } else {
        loader.style.display = 'block'
    loaderMsg.innerText = 'Distribuindo notas...'
    turmasRef.child(alunosSelecionadosTurma.codTurma + '/notas').set(notasDistribuidas).then(() => {
        loader.style.display = 'none'
        $('#modal').modal('hide')
        AstNotif.notify('Sucesso', 'Notas distribuídas!')
    }).catch(error => {
        loader.style.display = 'none'
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })
    }
    
}

function somaNotasDistribuidas(id, subtrai=false) {
    let somaNotasDist = document.getElementById('somaNotasDistribuidas')
    if (subtrai) {
        try {
            notasDistribuidas[document.getElementById('nomeNota' + id).value] = null
        } catch (error) {
            console.log(error)
        }
        
    } else {
        notasDistribuidas[document.getElementById('nomeNota' + id).value] = Number(document.getElementById('valorNota' + id).value)
    }
    somaNotasDist.innerText = 0
    somatorioDistribuidas = 0
    for (const idValor in notasDistribuidas) {
        if (Object.hasOwnProperty.call(notasDistribuidas, idValor)) {
            const valor = notasDistribuidas[idValor];
            somatorioDistribuidas += Number(valor)
            if (somatorioDistribuidas > 100) {
                somaNotasDist.style.color = 'red'
            } else {
                somaNotasDist.style.color = 'black'
            }
        }
    }
    somaNotasDist.innerText = somatorioDistribuidas
}

function selecionaTodos(source) {
    let checkboxes = document.getElementsByName('alunosTurma');
    for(var i=0, n=checkboxes.length;i<n;i++) {
        if (source.checked) {
            checkboxes[i].checked = false;
            checkboxes[i].click()
        } else {
            checkboxes[i].checked = true;
            checkboxes[i].click()
        }
        
    }
    
}

function lancaFrequencia(alunos={}, turma="", data='', confirma=false) {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Lançando frequências...'
        console.log(data)
        if (alunos.codTurma != '') {
            delete alunos.codTurma
        }

        turmasRef.child(turma + '/frequencia/' + data).set(alunos).then(() => {
            async function frequenciaAluno() {
                for (const matricula in alunos) {
                    if (Object.hasOwnProperty.call(alunos, matricula)) {
                        const aluno = alunos[matricula];
                        turmasRef.child(turma + '/alunos/' + formataNumMatricula(matricula) + '/frequencia/' + data).set({turma: turma}).then(() => {
                            
    
                            
                        }).catch(error => {
                            AstNotif.dialog('Erro', error.message)
                            loader.style.display = 'none'
                            console.log(error)
                        })
                    }
                }
            }

            frequenciaAluno().then(() => {
                AstNotif.notify('Sucesso', 'As frequências foram lançadas com sucesso!')
                loader.style.display = 'none'
            }).catch(error => {
                AstNotif.dialog('Erro', error.message)
                console.log(error)
            })
            
            
            loader.style.display = 'none'
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
            loader.style.display = 'none'
        })
    } else {
        let nomes = ''
        let turma
        for (const matricula in alunosSelecionadosTurma) {
            if (Object.hasOwnProperty.call(alunosSelecionadosTurma, matricula)) {
                const aluno = alunosSelecionadosTurma[matricula];
                if (matricula == 'codTurma') {
                    turma = aluno
                } else if(matricula == undefined || aluno == undefined) {

                } else {
                    nomes += formataNumMatricula(matricula) + ': ' + aluno + '<br>'
                }
                
            }
        }
        abrirModal('modal', 'Lançamento de freqêuncia', 
            `Você selecionou os alunos listados abaixo da turma ${turma}. <br> ${nomes} <br><b>Você deseja lançar frequências para esses alunos para que dia?</b><br>
            <input type="date" class="form-control" name="dataFrequencia" id="dataFrequencia">
            `
            , `<button type="button" data-toggle="tooltip" data-placement="top" title="Lançar frequência para os alunos selecionados" class="btn btn-primary" onclick="lancaFrequencia(alunosSelecionadosTurma,'${turma}', document.getElementById('dataFrequencia').value, true)">Lançar</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
        )
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
        let selectTurmasTransfere = document.getElementById('selectTurmasTransfere')
        for (const cod in turmas) {
            if (Object.hasOwnProperty.call(turmas, cod)) {
                const infoDaTurma = turmas[cod];
                if (infoDaTurma.professor == undefined) {
                    var profReferencia = 'Não cadastrado'
                } else {
                    var profReferencia = infoDaTurma.professor[0].nome
                }
                selectTurmasTransfere.innerHTML += `<option value="${cod}">Turma ${cod} (Prof. ${profReferencia})</option>`
            }
        }
    }
    
}

function abreTurma(cod) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Abrindo turma...'
    carregaListaDeAlunosDaTurma(cod)
    var codigoDaTurmaLabel = document.getElementById('codigoDaTurma')
    var areaInfoTurma = document.getElementById('areaInfoTurma')
    turmasRef.child(cod).on('value', (snapshot) => {
        // TODO: Mostrar na tela as informações da turma
        console.log(snapshot.val())
        let dadosDaTurma = snapshot.val()
        codigoDaTurmaLabel.innerText = dadosDaTurma.codigoSala
        areaInfoTurma.style.visibility = 'visible'
        
        // Área separação KIDS, TEENS, ADULTS
        var faixa
        if (dadosDaTurma.faixaTurma == 'A') {
            faixa = 'ADULTS'
        } else if(dadosDaTurma.faixaTurma == 'T') {
            faixa = 'TEENS'
        } else {
            faixa = dadosDaTurma.faixaTurma
        }
        document.getElementById('mostraFaixa').innerHTML = `<a class="list-group-item list-group-item-action active" data-toggle="list" role="tab">${faixa}</a>`
        // Mostra dias de aula da turma
        document.getElementById('mostraDiasTurma').innerText = 'Dia(s) de Aula:'
        for (const key in dadosDaTurma.diasDaSemana) {
            if (Object.hasOwnProperty.call(dadosDaTurma.diasDaSemana, key)) {
                const dia = dadosDaTurma.diasDaSemana[key];
                document.getElementById('mostraDiasTurma').innerText += ' ' + dia + ' '
            }
        }
        document.getElementById('mostraHorarioTurma').innerText = 'Horário de aula: '+ dadosDaTurma.hora + 'h'
        
        document.getElementById('mostraLivrosTurma').innerText = 'Livros cadastrados: '
        for (const key in dadosDaTurma.livros) {
            if (Object.hasOwnProperty.call(dadosDaTurma.livros, key)) {
                const numLivro = dadosDaTurma.livros[key];
                document.getElementById('mostraLivrosTurma').innerText += ` Book ${numLivro} |`
            }
        }

        document.getElementById('timestampTurmaCadastrada').innerText = 'Turma cadastrada em:  ' + new Date(dadosDaTurma.timestamp._seconds * 1000)

        document.getElementById('mostraProfessoresCadastrados').innerHTML = `<ul class="items" id="ulProfCadastrados"></ul>`
        for (const key in dadosDaTurma.professor) {
            if (Object.hasOwnProperty.call(dadosDaTurma.professor, key)) {
                const professor = dadosDaTurma.professor[key];
                document.getElementById('ulProfCadastrados').innerHTML += `
                    <li class="item-dismissible">${professor.nome} (${professor.email})</li>
                `
            }
        }
        loader.style.display = 'none'
        
    })
}

function preencheEndereco(numCep) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Buscando enderenço com o CEP...'
    let enderecoAluno = document.getElementById('enderecoAluno')
    let bairroAluno = document.getElementById('bairroAluno')
    let cidadeAluno = document.getElementById('cidadeAluno')
    let cepAluno = document.getElementById('cepAluno')
    let estadoAluno = document.getElementById('estadoAluno')
    getAddress(numCep).then(function(result){
        if (result.street == undefined) {
            AstNotif.dialog('Erro ao buscar CEP', 'Verifique o CEP digitado e tente novamente.')
        } else {
            enderecoAluno.value = result.street
            bairroAluno.value = result.neighborhood
            cidadeAluno.value = result.city
            estadoAluno.value = result.state
            document.getElementById('numeroAluno').focus()
            AstNotif.toast('Dados de endereço preenchidos com sucesso!')
        }
        loader.style.display = 'none'
        
    }).catch(function(error){
        AstNotif.dialog('Erro ao buscar CEP', error.message)
        console.log(error)
        loader.style.display = 'none'
    })
}

//Funções da aba Alunos
var tipoDeBusca = 'nomeAluno'
function alteraTipoDeBusca(tipo) {
    tipoDeBusca = tipo
}


var dadosResponsaveis = {}
function abreDadosDoAluno(matricula, desativado=false, notasDesativado=false) {
    carregaHistoricoAluno(matricula)
    document.getElementById('infoDoAluno').style.display = 'block'
    document.getElementById('rolaTelaAbaixoAlunos').style.display = 'block'
    let dados
    if (desativado != false) {
        dados = desativado
        document.getElementById('alunoDesativado').style.display = 'block'
    } else {
        dados = alunos[matricula]
        document.getElementById('alunoDesativado').style.display = 'none'
    }
    dadosResponsaveis = {
        nomeResponsavelAluno1: dados.nomeResponsavelAluno1,
        relacaoAluno1: dados.relacaoAluno1,
        numeroComercialResponsavel1: dados.numeroComercialResponsavel1,
        numeroCelularResponsavel1: dados.numeroCelularResponsavel1,
        rgResponsavel1: dados.rgResponsavel1,
        cpfResponsavel1: dados.cpfResponsavel1,
        // Dados de Filiação responsável 2
        nomeResponsavelAluno2: dados.nomeResponsavelAluno2,
        relacaoAluno2: dados.relacaoAluno2,
        numeroComercialResponsavel2: dados.numeroComercialResponsavel2,
        numeroCelularResponsavel2: dados.numeroCelularResponsavel2,
        rgResponsavel2: dados.rgResponsavel2,
        cpfResponsavel2: dados.cpfResponsavel2,
        // Dados de Filiação Responsável financeiro
        nomeResponsavelFinanceiroAluno: dados.nomeResponsavelFinanceiroAluno,
        relacaoFinanceiroAluno: dados.relacaoFinanceiroAluno,
        numeroComercialFinanceiroAluno: dados.numeroComercialFinanceiroAluno,
        numeroCelularFinanceiroAluno: dados.numeroCelularFinanceiroAluno,
        rgFinanceiroAluno: dados.rgFinanceiroAluno,
        cpfFinanceiroAluno: dados.cpfFinanceiroAluno,
        // Dados de Filiação responsável pedagógico/didático
        nomeResponsavelPedagogicoAluno: dados.nomeResponsavelPedagogicoAluno,
        relacaoPedagogicoAluno: dados.relacaoPedagogicoAluno,
        numeroComercialPedagogicoAluno: dados.numeroComercialPedagogicoAluno,
        numeroCelularPedagogicoAluno: dados.numeroCelularPedagogicoAluno,
        rgPedagogicoAluno: dados.rgPedagogicoAluno,
        cpfPedgogicoAluno: dados.cpfPedgogicoAluno
    }

    
    
    document.getElementById('mostraNomeAluno').innerText = dados.nomeAluno
    document.getElementById('mostraCpfAluno').innerText = dados.cpfAluno
    document.getElementById('mostraRgAluno').innerText = dados.rgAluno
    document.getElementById('mostraCelularAluno').innerText = dados.celularAluno
    document.getElementById('mostraTelefoneAluno').innerText = dados.telefoneAluno
    document.getElementById('timestampDoAluno').innerText = 'Aluno cadastrado em: ' + new Date(dados.timestamp._seconds * 1000)
    document.getElementById('mostraDataNascimentoAluno').innerText = dados.dataNascimentoAluno

    let nascimento = dados.dataNascimentoAluno.split('-')
    let nascimentoObj = new Date()
    nascimentoObj.setDate(Number(nascimento[2]))
    nascimentoObj.setFullYear(Number(nascimento[0]))
    nascimentoObj.setMonth(Number(nascimento[1]) - 1)
    calcularIdadePrecisa(nascimentoObj).then(function(idade){
        document.getElementById('mostraIdadeAluno').innerText = `${idade.years} anos, ${idade.months} mês(es), e ${idade.days} dias`
    }).catch(function(error){
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })
    document.getElementById('mostraHoraEDiasAluno').innerText = dados.horaEDiasAluno
    document.getElementById('mostraTurmaAluno').innerHTML = dados.turmaAluno
    document.getElementById('mostraEmailAluno').innerText = dados.emailAluno
    document.getElementById('mostraMatriculaAluno').innerText = dados.matriculaAluno
    document.getElementById('mostraEnderecoAluno').innerText = `${dados.enderecoAluno}, ${dados.numeroAluno}, ${dados.bairroAluno}, ${dados.cidadeAluno}, ${dados.estadoAluno}. CEP ${dados.cepAluno}.`
    document.getElementById('rolaTelaAbaixoAlunos').focus()
    document.getElementById('rolaTelaAbaixoAlunos').style.display = 'none'
    turmasRef.child(`${dados.turmaAluno}/alunos/${matricula}/notas`).once('value').then(snapshot => {
        let notas = snapshot.val()
        if (desativado != false) {
            notas = notasDesativado
        }
        console.log(notas)
        let notasDoAlunoDiv = document.getElementById('notasDoAluno')
        notasDoAlunoDiv.innerHTML = ''
        if (notas == null) {
            notasDoAlunoDiv.innerHTML = 'Nenhuma nota foi lançada para este aluno'
        }
        for (const nomeNota in notas) {
            if (Object.hasOwnProperty.call(notas, nomeNota)) {
                const valorNota = notas[nomeNota];
                notasDoAlunoDiv.innerHTML += `
                <small id="nomeNota${nomeNota}"><b>${nomeNota}</b>: ${valorNota}</small> 
                <div class="progress mb-3" style="height: 10px">
                  <div class="progress-bar bg-primary" role="progressbar" style="width: ${valorNota}%" aria-valuenow="${valorNota}" aria-valuemin="0" aria-valuemax="100">${valorNota}</div>
                </div>
                `
            }
        }

        /*document.getElementById('pontosAudicao').innerText = notas.audicao
        document.getElementById('pontosFala').innerText = notas.fala
        document.getElementById('pontosEscrita').innerText = notas.escrita
        document.getElementById('pontosLeitura').innerText = notas.leitura
        document.getElementById('barraPontosAudicao').style.width = notas.audicao * 20 + '%'
        document.getElementById('barraPontosFala').style.width = notas.fala * 20 + '%'
        document.getElementById('barraPontosEscrita').style.width = notas.escrita * 20 + '%'
        document.getElementById('barraPontosLeitura').style.width = notas.leitura * 20 + '%'*/
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })
}

function followUpAluno(matricula) {
    
    if (matricula == '00000' || matricula == '') {
        AstNotif.dialog('Atenção', 'Você deve clicar em um aluno para descrever um follow up.')
        loader.style.display = 'none'
    } else {
        followUpRef.on('value', (snapshot) => {
            const aluno = alunos[matricula]
            let id
            let followUpSalvos
            if (snapshot.exists() == false) {
                id = 0
            } else {
                followUpSalvos = snapshot.val()
                for (const idFollow in followUpSalvos) {
                    if (Object.hasOwnProperty.call(followUpSalvos, idFollow)) {
                        const followUp = followUpSalvos[idFollow];
                        id = Number(idFollow) + 1
                    }
                }
            }
            abrirModal('modal', 'Adicionar um Follow Up', `
                <form id="adicionarFollowUpAluno" >
                    <label>Nome: ${aluno.nomeAluno}</label> | <label>Matrícula: ${aluno.matriculaAluno}</label>

                    <div class="input-group mb-3">
                        <div class="input-group-prepend">
                            <span class="input-group-text" id="basic-addon3">ID do FollowUp</span>
                        </div>
                        <input type="text" class="form-control" id="idFollowUpAluno" name="idFollowUpAluno" aria-describedby="basic-addon3" readonly value="${id}">
                    </div>
                    <div class="input-group mb-3">
                        <div class="input-group-prepend">
                            <span class="input-group-text" id="tituloFollowUpAluno" >Título</span>
                        </div>
                        <input type="text" class="form-control" name="tituloFollowUpAluno" id="basic-url" aria-describedby="basic-addon3">
                    </div>
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text">Descrição</span>
                        </div>
                        <textarea class="form-control" aria-label="With textarea" name="descricaoFollowUp"></textarea>
                    </div>
                    <br>
                    <button class="btn btn-primary" type="submit" id="salvarFollowUpAluno">Salvar Follow Up</button>
                    <input type="text" name="matriculaFollowUp" id="matriculaFollowUp" value="${aluno.matriculaAluno}" style="display: none">
                    <input type="text" name="nomeFollowUp" id="nomeFollowUp" value="${aluno.nomeAluno}" style="display: none">
                </form>`,
                `<button class="btn btn-secondary" data-dismiss="modal">Cancelar</button><button class="btn btn-primary" data-dismiss="modal" onclick="carregaFollowUps('${aluno.matriculaAluno}')">Ver todos os Follow Up do aluno</button>`
            )
            document.querySelector('#adicionarFollowUpAluno').addEventListener('submit', (e) => {
                e.preventDefault()
                loader.style.display = 'block'
                loaderMsg.innerText = 'Carregando dados do FollowUp...'
                const dados = new FormData(e.target);
                let dadosFollowUp = {}
                dadosFollowUp.nome = dados.get('nomeFollowUp')
                dadosFollowUp.matricula = dados.get('matriculaFollowUp')
                dadosFollowUp.descricao = dados.get('descricaoFollowUp')
                dadosFollowUp.titulo = dados.get('tituloFollowUpAluno')
                dadosFollowUp.id = dados.get('idFollowUpAluno')
                dadosFollowUp.autor = usuarioAtual().displayName
                console.log(dadosFollowUp)
                followUpRef.child(dadosFollowUp.id).set(dadosFollowUp).then(() => {
                    AstNotif.notify('Sucesso', 'O FollowUp foi salvo com sucesso.', 'agora', {length: -1})
                    loader.style.display = 'none'
                }).catch(error =>{
                    AstNotif.dialog('Erro', error.message)
                    console.log(error)
                    loader.style.display = 'none'
                })
            })
        })
        
    }
}

function carregaFollowUps(matricula='') {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando Follow Up...'
    followUpRef.orderByChild('matricula').equalTo(matricula).once('value').then(snapshot => {
        abrirModal('modal', `FollowUp(s) cadastrado(s)`,
            `
            <label id="nomeAlunoDoFollowUp"></label>
            <div class="overflow-auto" style="height: fit-content; max-height: 280px;">
                <div class="list-group" id="listaFollowUpAluno">

                </div>
            </div>
            `
            , `<button class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
        )
        let listaFollowUpAluno = document.getElementById('listaFollowUpAluno')
        listaFollowUpAluno.innerHTML = ''
        for (const id in snapshot.val()) {
            if (Object.hasOwnProperty.call(snapshot.val(), id)) {
                const followUp = snapshot.val()[id];
                document.getElementById('nomeAlunoDoFollowUp').innerText = followUp.nome + ' | ' + followUp.matricula
                listaFollowUpAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verFollowUp('${id}')"><b>Título:</b> ${followUp.titulo}</button>`
            }
        }
        loader.style.display = 'none'
    }).catch((error) => {
        console.log(error)
        AstNotif.dialog('Erro', error.message)
        loader.style.display = 'none'
    })
}

function verFollowUp(id) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando FollowUp...'
    followUpRef.child(id).once('value').then(snapshot => {
        AstNotif.dialog(snapshot.val().titulo, snapshot.val().descricao + ' <br><br> <b>Autor do FollowUp:</b> ' + snapshot.val().autor, {positive: "OK",negative: ''})

        loader.style.display = 'none'
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loader.style.display = 'none'
    })
    
}

function carregaHistoricoAluno(matricula) {
    let listaHistoricoAluno = document.getElementById('listaHistoricoAluno')
    listaHistoricoAluno.innerHTML = ''
    try {
        const historico = alunos[matricula].historico
        for (const key in historico) {
            if (Object.hasOwnProperty.call(historico, key)) {
                const infos = historico[key];
                if (infos.operacao == 'Transferência de alunos') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: ${infos.dados.turmaAtual} --> ${infos.dados.turmaParaQualFoiTransferido}</button>`
                } else if(infos.operacao == 'Desativação de aluno') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: ${infos.dados.turmaAtual} --> Desativado</button>`
                } else if (infos.operacao == 'Reativação de aluno') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: Aluno reativado na turma ${infos.dados.turmaAtivacao}</button>`
                }
            }
        }
    } catch (error) {
        const historico = alunosDesativados[matricula].dadosAluno.historico
        for (const key in historico) {
            if (Object.hasOwnProperty.call(historico, key)) {
                const infos = historico[key];
                if (infos.operacao == 'Transferência de alunos') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: ${infos.dados.turmaAtual} --> ${infos.dados.turmaParaQualFoiTransferido}</button>`
                } else if(infos.operacao == 'Desativação de aluno') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: ${infos.dados.turma} --> Desativado</button>`
                } else if (infos.operacao == 'Reativação de aluno') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: Aluno reativado na turma ${infos.dados.turmaAtivacao}</button>`
                }
            }
        }
    }
    
}

function verOperacaoAluno(matricula, key) {
    const infos = alunos[matricula].historico[key]
    let corpo = `
        
    `
    abrirModal('modal', 'Visualização da operação ' + infos.operacao, corpo, `<button class="btn btn-secondary" data-dismiss="modal">Fechar</button>`)
}