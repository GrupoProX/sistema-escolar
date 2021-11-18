var numerosRef = firebase.database().ref('sistemaEscolar/numeros')
var aniversariosRef = firebase.database().ref('sistemaEscolar/aniversarios')
var listaDeUsuariosRef = firebase.database().ref('sistemaEscolar/listaDeUsuarios')
var listaDeProfessores = firebase.database().ref('sistemaEscolar/listaDeProfessores')
var turmasRef = firebase.database().ref('sistemaEscolar/turmas')
var ultimaMatriculaRef = firebase.database().ref('sistemaEscolar/ultimaMatricula')
var alunosRef = firebase.database().ref('sistemaEscolar/alunos')
var followUpRef = firebase.database().ref('sistemaEscolar/followUp')
var usuarioRef = firebase.database().ref('sistemaEscolar/usuarios')
var desempenhoRef = firebase.database().ref('sistemaEscolar/notasDesempenho/referencia')
var cursosRef = firebase.database().ref('sistemaEscolar/infoEscola/cursos')
var contratosRef = firebase.database().ref('sistemaEscolar/infoEscola/contratos')
var docsBoletosRef = firebase.database().ref('sistemaEscolar/docsBoletos')

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
    
    if (user == null) {
        loaderRun()
        
        abrirModal('modal', 'Login',
            `
            <div class="container">
                <h3>Seja bem-vindo!</h3>
                <h6>Para acessar o sistema, digite seu e-mail e sua senha cadastradas.</h6>
                <form id="areaLogin">
                    <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="inputEmail4">Email</label>
                        <input type="email" name="usuario" class="form-control" id="usuario" placeholder="Email">
                        <a style="cursor: pointer;" id="esqueceuSenha" class="text-center" data-toggle="tooltip" data-placement="right" title="Digite seu e-mail no campo, e clique aqui para que possamos te ajudar.">Esqueci minha senha</a>
                    </div>
                    <div class="form-group col-md-6">
                        <label for="inputPassword4">Senha</label>
                        <input type="password" name="senha" class="form-control" id="inputPassword4" placeholder="Senha">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" id="btnEntrar">Entrar no sistema</button>
                    <br><br>
                    
                </form>
            </div>
            `,
            `<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>`
        )
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })

        document.getElementById('esqueceuSenha').addEventListener('click', (e) => {
            let email = document.getElementById('usuario').value
            if(email == "" || email.indexOf('@') == -1) {
                AstNotif.dialog('Erro', 'Por favor, digite seu e-mail corretamente.')
            } else {
                loaderRun(true, 'Enviando email de verificação')
                firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                   loaderRun()
                   AstNotif.dialog('Sucesso', 'Acabamos de enviar um e-mail com um link para redefinição da sua senha. Confira sua Caixa de Entrada ou SPAM.')
                })
                .catch((error) => {
                    let errorCode = error.code;
                    let errorMessage = error.message;
                    AstNotif.dialog('Erro', errorMessage)
                    console.log(error)
                });
            }
        })
    
        document.querySelector('#areaLogin').addEventListener('submit', (e) => {
            loaderRun(true, 'Conectando ao sistema...')
            e.preventDefault()
            const formData = new FormData(e.target);
            var senha = formData.get('senha')
            var email = formData.get('usuario')
            firebase.auth().useDeviceLanguage();

            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
                .then(() => {
                    loaderRun(true, 'Autenticando usuário...')
                    // Existing and future Auth states are now persisted in the current
                    // session only. Closing the window would clear any existing state even
                    // if a user forgets to sign out.
                    // ...
                    // New sign-in will be persisted with session persistence.
                    return firebase.auth().signInWithEmailAndPassword(email, senha);
                }).then((result) => {
                    loaderRun()
                    $('#modal').modal('hide')
                })
                .catch((error) => {
                    // Handle Errors here.
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    AstNotif.dialog('Erro', error.message)
                    loaderRun()
                });

        })
    } else {
        usuarioRef.child(user.uid).once('value').then(snapshot => {
            let dadosUser = snapshot.val()
            let listaAlunosMat = []
            
            if (dadosUser.professor != undefined) {
                turmasProf = dadosUser.professor.turmas
                let c = 0
                for (const turma in turmasProf) {
                    if (Object.hasOwnProperty.call(turmasProf, turma)) {
                        const bool = turmasProf[turma];
                        if (bool) {
                            document.getElementById('listaTurmasProf').innerHTML += `<button class="list-group-item list-group-item-action" id="btnTurma${c}" onclick="document.getElementById('btnAbaTurmas').click(), carregaTurmas('${turma}')">Turma ${turma}</button>`
                            
                            turmasRef.child(turma + '/alunos').on('value', matAlunos => {
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
                            })
                        }
                    }
                    c++
                }
                
            }
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        loader.style.display = 'block'
        loaderMsg.innerText = 'Buscando informações do usuário...'
        try {
            document.getElementById('username').innerHTML = "Olá,<br>" + user.displayName.split(' ')[0]
            if (user.photoURL != null) {
                document.getElementById('profilePic').src = user.photoURL
                
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
            loaderRun()
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
        loaderRun()
    } else {
        loaderRun()
    }
    
}

var turmas
// Funções da aba de turmas dos professores
function carregaTurmas(preSelecao='') {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando informações das turmas...'
    var selectTurmas = document.getElementById('selectTurmas')
    selectTurmas.innerHTML = ''
    let selected = false
    for (const turma in turmasProf) {
        if (Object.hasOwnProperty.call(turmasProf, turma)) {
            const bool = turmasProf[turma];
            if (bool) {
                turmasRef.child(turma).once('value').then(snapshot => {
                    selectTurmas.innerHTML += '<option hidden>Escolha uma turma...</option>'
                    let infoDaTurma = snapshot.val()
                    if (infoDaTurma.professor == undefined) {
                        var profReferencia = 'Não cadastrado'
                    } else {
                        var profReferencia = infoDaTurma.professor[0].nome
                    }
                    if (preSelecao == snapshot.key || alunosSelecionadosTurma.codTurma != undefined) {
                        selected = 'selected'
                    } else {
                        selected = false
                    }
                    selectTurmas.innerHTML += `<option ${selected} value="${snapshot.key}">Turma ${snapshot.key} (Prof. ${profReferencia})</option>`
                    document.getElementById('selectTurmas').style.visibility = 'visible'
                    loaderRun()
                }).catch(error => {
                    loaderRun()
                    console.error(error)
                    AstNotif.dialog('Erro', error.message)
                })
            }
        }
    }
    if (preSelecao != '') {
        abreTurma(preSelecao)
    }
    
}

var alunosSelecionadosTurma = {}


function carregaListaDeAlunosDaTurma(turma, filtro='') {
    
    tipoDeBusca = 'nome'
    alunosSelecionadosTurma = {}
    alunosSelecionadosTurma.codTurma = turma
    console.log(filtro)
    document.getElementById('codTurmaAlunos').value = turma
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando lista de alunos...'
    let listaAlunos = document.getElementById('listaAlunos')
    if (filtro == '') {
        turmasRef.child(turma + '/alunos').on('value', (snapshot) => {
            document.getElementById('listaAlunosDaTurma').innerHTML = ''
            let alunosTurma = snapshot.val()
            let c = 0
            for (const matricula in alunosTurma) {
                if (Object.hasOwnProperty.call(alunosTurma, matricula)) {
                    const aluno = alunosTurma[matricula];
                    let notas = aluno.notas
                    let somatorioNota = 0
                    c++
                    for (const nomeNota in notas) {
                        if (Object.hasOwnProperty.call(notas, nomeNota)) {
                            const valorNota = notas[nomeNota];
                            somatorioNota += valorNota
                        }
                    }
                    document.getElementById('listaAlunosDaTurma').innerHTML += `
                    <tr>
                        <td>
                            <span class="custom-checkbox">
                                <input type="checkbox" id="checkbox${c}" name="options[]" value="${matricula}|${aluno.nome}">
                                <label for="checkbox${c}"></label>
                            </span>
                        </td>
                        <td><a href="#" onclick="document.getElementById('btnAbaAlunos').click(), document.getElementById('btnAbaAlunosResponsivo').click(), abreDadosDoAluno('${matricula}'), setTimeout( function() {document.getElementById('rolaTelaAbaixoAlunos').style.display = 'block', document.getElementById('rolaTelaAbaixoAlunos').focus(), document.getElementById('rolaTelaAbaixoAlunos').style.display = 'none'}, 300 ); ">${aluno.nome}</a></td>
                        <td>${matricula}</td>
                        <td><b>${somatorioNota}</b>/100</td>
                        <td>
                            <a href="#" class="action" id="lancaFrequencia${c}" onclick="lancaDesempenho('${matricula}', '${turma}')"><i data-feather="edit-2" data-toggle="tooltip" title="Lançar Desempenho"></i></a>
                            <a href="#" id="lançaNotas${c}" onclick="editaNotasAluno('${matricula}', '${turma}')" class="edit"><i data-feather="edit" data-toggle="tooltip" title="Lançar notas"></i></a>
                        </td>
                    </tr>
                    `
                    document.getElementById('mostraQtdeAlunosTurma').innerText = c
                    document.getElementById('qtdeAlunosTurma').value = c
                }
                
                
                
            }
            loaderRun()
            $(function () {
                $('[data-toggle="tooltip"]').tooltip()
            })
            feather.replace()
            ativaCheckboxes()
        })
    } else {
        turmasRef.child(turma + '/alunos').orderByChild('nome').startAt(filtro).endAt(filtro+"\uf8ff").on('value', (snapshot) => {
            document.getElementById('listaAlunosDaTurma').innerHTML = ''
            let alunosTurma = snapshot.val()
            let c = 0
            for (const matricula in alunosTurma) {
                if (Object.hasOwnProperty.call(alunosTurma, matricula)) {
                    const aluno = alunosTurma[matricula];
                    let notas = aluno.notas
                    let somatorioNota = 0
                    c++
                    for (const nomeNota in notas) {
                        if (Object.hasOwnProperty.call(notas, nomeNota)) {
                            const valorNota = notas[nomeNota];
                            somatorioNota += valorNota
                        }
                    }
                    document.getElementById('listaAlunosDaTurma').innerHTML += `
                    <tr>
                        <td>
                            <span class="custom-checkbox">
                                <input type="checkbox" id="checkbox${c}" name="options[]" value="${matricula}|${aluno.nome}">
                                <label for="checkbox${c}"></label>
                            </span>
                        </td>
                        <td><a href="#" onclick="document.getElementById('btnAbaAlunos').click(), document.getElementById('btnAbaAlunosResponsivo').click(), abreDadosDoAluno('${matricula}'), setTimeout( function() {document.getElementById('rolaTelaAbaixoAlunos').style.display = 'block', document.getElementById('rolaTelaAbaixoAlunos').focus(), document.getElementById('rolaTelaAbaixoAlunos').style.display = 'none'}, 300 ); ">${aluno.nome}</a></td>
                        <td>${matricula}</td>
                        <td><b>${somatorioNota}</b>/100</td>
                        <td>
                            <a href="#" class="action" id="lancaFrequencia${c}" onclick="lancaDesempenho('${matricula}', '${turma}')"><i data-feather="edit-2" data-toggle="tooltip" title="Lançar Desempenho"></i></a>
                            <a href="#" id="lançaNotas${c}" onclick="editaNotasAluno('${matricula}', '${turma}')" class="edit"><i data-feather="edit" data-toggle="tooltip" title="Lançar notas"></i></a>
                        </td>
                    </tr>
                    `
                    document.getElementById('mostraQtdeAlunosTurma').innerText = c
                    document.getElementById('qtdeAlunosTurma').value = c
                }
                
                
                
            }
            loaderRun()
            $(function () {
                $('[data-toggle="tooltip"]').tooltip()
            })
            feather.replace()
            ativaCheckboxes()
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
                document.getElementById('infoTurma').style.color = 'gold'
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
document.getElementById('listaAlunosTurmaForm').addEventListener('submit', (e) => {
    e.preventDefault()
    console.log(e)
    const dados = new FormData(e.target);
    let codTurma = dados.get('codTurmaAlunos')
    let qtdeAlunosTotal = dados.get('qtdeAlunosTurma')
    let arrayAlunos = dados.getAll('options[]')
    if (arrayAlunos.length == 0) {
        AstNotif.dialog('Opa...', 'Você esqueceu de selecionar os alunos. Volte, e marque as caixas dos alunos que deseja fazer lançamentos.')
    } else {
        let objAlunos = {}
        for (const i in arrayAlunos) {
            if (Object.hasOwnProperty.call(arrayAlunos, i)) {
                const infoAluno = arrayAlunos[i];
                objAlunos[infoAluno.split('|')[0]] = infoAluno.split('|')[1]
            }
        }
        console.log(objAlunos)
        if (e.submitter.id == 'btnLancaFrequencia') {
            console.log(e.submitter.id)
            lancaFrequencia(objAlunos, codTurma)
        } else if(e.submitter.id == 'btnLancaNotas') {
            console.log(e.submitter.id)
            lancaNotas(objAlunos, codTurma)
        }
    }
    
})

function iniciaPeriodo(confirma=false, inicio='', fim='', qtdeAulas='', nomePeriodo='') {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Iniciando turma...'
        if (inicio == '' || fim == '' || qtdeAulas == '' || nomePeriodo == '') {
            AstNotif.dialog('Você esqueceu alguns dados...', 'Por favor preencha todos os dados pedidos para iniciar a turma')
            loaderRun()
        } else {
            turmasRef.child(alunosSelecionadosTurma.codTurma + '/status').set({turma: 'aberta', inicio: inicio, fim: fim, qtdeAulas: qtdeAulas, nomePeriodo: nomePeriodo}).then(()=>{
                $('#modal').modal('hide')
                AstNotif.notify('Sucesso', 'Turma aberta')
                carregaListaDeAlunosDaTurma(alunosSelecionadosTurma.codTurma)
                loaderRun()
            }).catch(error => {
                loaderRun()
                console.log(error)
                AstNotif.dialog('Erro', error.message)
            })
        }
    } else {
        abrirModal('modal', 'Confirmação de abertura da turma ' + alunosSelecionadosTurma.codTurma, `
            Atenção. Você está prestes a iniciar as atividades da turma ${alunosSelecionadosTurma.codTurma}. Ao iniciar a turma, você poderá lançar notas e frequências para os alunos que estão cadastrados na turma.<br>
            <br>
            <b>Escolha uma data de início e um data com o fim previsto deste semestre, bimestre, ano...</b> (Essas datas não farão com que o sistema abra ou feche as turmas automaticamente. Um professor cadastrado na turma é quem deve iniciar e fechar a turma manualmente)<br><br>
            Nome do período:
            <input type="text" class="form-control" name="nomePeriodo" id="nomePeriodo">
            <small id="cadastrarEntrar" class="form-text text-muted">
                O nome do período pode ser por exemplo: 1º Semestre, ou 2º Bimestre ...
            </small>
            <br>Início previsto:
            <input type="date" class="form-control" name="dataInicioPeriodo" id="dataInicioPeriodo">
            <br> Fim previsto:
            <input type="date" class="form-control" name="dataFimPeriodo" id="dataFimPeriodo">
            <br> Previsão de quantidade de aulas ministradas:
            <input type="number" class="form-control" name="qtdeAulas" id="qtdeAulas">
            <small id="cadastrarEntrar" class="form-text text-muted">
                A quantidade de aulas serve como referência para você e para os alunos para acompanhar o andamento do curso e também poderá ser modificada antes do fechamento desta turma.
            </small>

        `, 
        `<button type="button" data-toggle="tooltip" data-placement="top" title="Iniciar atividades da turma no sistema" class="btn btn-primary" onclick="iniciaPeriodo(true, document.getElementById('dataInicioPeriodo').value, document.getElementById('dataFimPeriodo').value, document.getElementById('qtdeAulas').value, document.getElementById('nomePeriodo').value)">Iniciar turma</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`)
    }
}

function fechaPeriodo() {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Recuperando status da turma...'
        turmasRef.child(alunosSelecionadosTurma.codTurma + '/status').once('value').then(status => {
            console.log(status)
            console.log(status.val())
            abrirModal('modal', 'Confirmação de fechamento da turma ' + alunosSelecionadosTurma.codTurma, `
            Atenção. Você está prestes a fechar as atividades da turma ${alunosSelecionadosTurma.codTurma}. Ao fechar a turma, você não poderá mais lançar notas e frequência para esta turma, até que você inicie novamente mais um período para esta turma. <b>Automaticamente, ao fechar a turma, o sistema irá iniciar uma sequência de processos para a geração de boletins, notas, somatórios finais, frequência, desempenho, entre outros processos parecidos.</b> (Esses processos são realizados nos servidores remotos do sistema para maior segurança e integridade dos dados.)<br>
            Confirme os dados de início, fim, e quantidade de aulas dadas do semestre que foram definidos no processo de abertura desse semestre da turma nos campos abaixo:<br><br>
            Nome do período:
            <input type="text" class="form-control" name="nomePeriodo" id="nomePeriodo" value="${status.val().nomePeriodo}">
            <small id="cadastrarEntrar" class="form-text text-muted">
                O nome do período pode ser por exemplo: 1º Semestre, ou 2º Bimestre ...
            </small>
            <br>
            <b>Altere as datas de início, fim e quantidade de aulas dadas, se necessário:</b><br>
            Início do período:
            <input type="date" class="form-control" name="dataInicioPeriodo" id="dataInicioPeriodo" value="${status.val().inicio}">
            <br> Fim do período:
            <input type="date" class="form-control" name="dataFimPeriodo" id="dataFimPeriodo" value="${status.val().fim}">
            <br> Quantidade de aulas dadas:
            <input type="number" class="form-control" name="qtdeAulasConfirma" id="qtdeAulasConfirma" value="${status.val().qtdeAulas}">

            `, 
            `<button type="button" id="btnFechaTurma" class='btn btn-warning'>Fechar Turma</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`)
            $(function () {
                $('[data-toggle="popover"]').popover()
            })

            document.querySelector('#btnFechaTurma').addEventListener('click', (e) => {
                e.preventDefault()
                loaderRun(true, 'Enviando pedido de fechamento de turma ao servidor...')
                // Aqui começará o fechamento de turmas
                let nomePeriodo = document.getElementById('nomePeriodo').value
                let ini = document.getElementById('dataInicioPeriodo').value
                let fim = document.getElementById('dataFimPeriodo').value
                let qtdeAulas = document.getElementById('qtdeAulasConfirma').value

                turmasRef.child(alunosSelecionadosTurma.codTurma + '/status').set({inicio: ini, fim: fim, qtdeAulas: qtdeAulas, turma: 'aberta', nomePeriodo: nomePeriodo}).then(() => {
                    var fechaTurma = firebase.functions().httpsCallable('fechaTurma')
                    fechaTurma(alunosSelecionadosTurma.codTurma).then(function(result){
                        AstNotif.dialog('Sucesso', result.data.answer)
                        loaderRun()
                        $('#modal').modal('hide')
                        abreTurma(alunosSelecionadosTurma.codTurma)
                    }).catch(function(error){
                        AstNotif.dialog('Erro', error.message)
                        console.log(error)
                        loaderRun()
                    })
                }).catch(error => {
                    AstNotif.dialog('Erro', error.message)
                    loaderRun()
                })
                
            })

            loaderRun()
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
            loaderRun()
        })


        
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
function lancaNotas(alunos={}, turma, confirma=false) {
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
        var lancarNotas = firebase.functions().httpsCallable('lancarNotas')
        lancarNotas({alunos: alunos, turma: turma, notas: notasParaLancar}).then(function(result){
            AstNotif.notify('Sucesso', result.data.answer)
            $('#modal').modal('hide')
            loaderRun()
        }).catch(function(error){
            loaderRun()
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
    } else {
        let nomes = ''
        
        for (const matricula in alunos) {
            if (Object.hasOwnProperty.call(alunos, matricula)) {
                const aluno = alunos[matricula];
                nomes += formataNumMatricula(matricula) + ': ' + aluno + '<br>'
                
            }
        }
        abrirModal('modal', 'Lançamento de notas', 
            `Você selecionou os alunos listados abaixo da turma ${turma}. <br> ${nomes} <br><b>Digite os valores nas notas que deseja lançar:</b><br>
            <section id="camposLancaNotas"></section>
            `
            , `<button type="button" id="btnLancaNotasNoModal" data-toggle="tooltip" data-placement="top" title="Lançar notas para os alunos selecionados" class="btn btn-primary">Lançar</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
        )
        document.getElementById('btnLancaNotasNoModal').addEventListener('click', (e) => {
            lancaNotas(alunos, turma, true)
        })
        turmasRef.child(alunosSelecionadosTurma.codTurma + '/notas').once('value').then(snapshot => {
            let notas = snapshot.val()
            if (notas != null) {
                notasDistribuidas = notas
            } else {
                AstNotif.dialog('Espera aí', 'Você não distribuiu notas nesta turma. Volte na turma e clique em "Distribuir notas".')
            }
            
            console.log(notas)
            let c = 0
            for (let nomeNota in notas) {
                if (Object.hasOwnProperty.call(notas, nomeNota)) {
                    const valor = notas[nomeNota];
                    let readonly = ''
                    let disabled = ''
                    let tooltip = ''
                    if (nomeNota == 'Desempenho') {
                        readonly = 'readonly'
                        disabled = 'disabled'
                        tooltip = 'data-toggle="tooltip" data-placement="top" title="Esta nota deve ser alterada no Desempenho do Aluno."'
                    }
                    document.getElementById('camposLancaNotas').innerHTML += `
                    <div class="row" id="linha${c}">
                        <div class="col-2" >
                            <input type="text" class="form-control" id="nomeNota${c}" placeholder="EX ${c + 1}" value="${nomeNota}" readonly>
                        </div>
                        <div class="col-2">
                            Total: ${valor}
                        </div>
                        <div class="col-2">
                            
                            <input type="number" min="0" max="${valor}" id="valorNota${c}" value="0" class="form-control"  placeholder="Total: ${valor}" onkeyup='this.value > ${valor} || this.value == "" ? this.value = 0: console.log("ok")' ${readonly} ${tooltip}>
                        </div>
                        <button type="button" class="btn btn-light btn-sm ${disabled}" ${disabled} onclick="document.getElementById('valorNota${c}').value = ${valor}">Dar Total</button><br>
                    </div>
                    `
                    c++
                }
            }
            $(function () {
                $('[data-toggle="tooltip"]').tooltip()
            })
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
                            if (nomeNota != document.getElementById('nomeNota' + c4).value) {
                                document.getElementById('valorNota' + (c4 + 1)).value = valor
                                c4++
                            } else {
                                console.log(valor)
                                console.log(c4)
                                document.getElementById('valorNota' + c4).value = valor
                                c4++
                            }
                        }
                    }
                    
                }).catch(error => {
                    loaderRun()
                    AstNotif.dialog('Erro', error.message)
                    console.log(error)
                })
            }
            feather.replace()
        }).catch(error => {
            loaderRun()
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

function incluirNotasDesempenho(turma=undefined, elementoCheckbox) {
    if (elementoCheckbox.checked) {
        desempenhoRef.once('value').then(snapshot => {
            let notasDesemp = snapshot.val()
            let somatorioDesemp = 0
            for (const nomeNota in notasDesemp) {
                if (Object.hasOwnProperty.call(notasDesemp, nomeNota)) {
                    const valor = notasDesemp[nomeNota];
                    somatorioDesemp += Number(valor)
                }
            }
            addCampoNota(somatorioDesemp, 'readonly', true) 
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        
    } else {
        let c = 0
        while (c < contadorNotas) {
            if (document.getElementById('nomeNota' + c).value == 'Desempenho') {
                somaNotasDistribuidas(c, true) 
                document.getElementById('linha' + c).remove() 
                contadorNotas--
                break
            }
            c++
        }
    }
    
    
}

function distribuiNotas() {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Buscando notas...'
    abrirModal('modal', 'Distribuição de notas da turma ' + alunosSelecionadosTurma.codTurma, 
            `Distribua os tipos de notas que você aplicará em sala de aula<br>
            <div class="input-group mb-3">
                <div class="input-group-prepend">
                    <div class="input-group-text">
                    <input type="checkbox" id="checkboxIncluiDesempenho" aria-label="Incluir Pontos do desempenho" onclick="incluirNotasDesempenho('${alunosSelecionadosTurma.codTurma}', this)">
                     &nbsp;Incluir pontos do desempenho no somatório da distribuição &nbsp;<span data-feather="help-circle" data-toggle="tooltip" data-placement="right" title="Ao marcar esta caixa, o somatório das notas de desempenho (que são definidas pela secretaria) será adicionado automaticamente ao somatório da distribuição de notas desta turma."></span>
                    </div>
                </div>
            </div>
            
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
                            <input type="text" class="form-control" id="nomeNota${c}" placeholder="EX ${c + 1}" value="${nomeNota}" ${nomeNota == 'Desempenho' ? ('readonly') : ''}>
                        </div>
                        <div class="col-2">
                            <input type="number" id="valorNota${c}" class="form-control" value="${valor}" onkeyup="somaNotasDistribuidas('${c}')" placeholder="15.5" ${nomeNota == 'Desempenho' ? ('readonly') : ''}>
                        </div>
                        <button type="button" id="removedor${c}" class="btn btn-light btn-sm" onclick="somaNotasDistribuidas('${c}', true), document.getElementById('linha${c}').remove(), contadorNotas--"><span data-feather="x-square"></span></button><br>
                    </div>
                    `
                    if (nomeNota == 'Desempenho') {
                        document.getElementById('removedor' + c).remove()
                        document.getElementById('checkboxIncluiDesempenho').checked = true
                    }
                    somaNotasDistribuidas(c)
                    c++
                }
            }
            contadorNotas = c
            feather.replace()
           

            loaderRun()
        }).catch(error => {
            loaderRun()
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
        
}



var contadorNotas = 0
var contadorNotasExtras = 0
function addCampoNota(valorInicial=0, readonly=false, desempenho=false) {
    let camposNotas = document.getElementById('camposNotas')
    document.getElementById('somaNotasDistribuidas').innerText = 0
    
    if (desempenho) {
        camposNotas.innerHTML += 
        `
        <div class="row" id="linha${contadorNotas}">
            <div class="col-2" >
                <input type="text" class="form-control" id="nomeNota${contadorNotas}" placeholder="EX ${contadorNotas + 1}" value="Desempenho" readonly>
            </div>
            <div class="col-2">
                <input type="number" id="valorNota${contadorNotas}" class="form-control" onkeyup="somaNotasDistribuidas('${contadorNotas}')" value="${valorInicial}" placeholder="15.5" readonly>
            </div>
        </div>
        `
        somaNotasDistribuidas(contadorNotas)
        feather.replace()
        contadorNotas++
        
    } else {
        camposNotas.innerHTML += 
        `
        <div class="row" id="linha${contadorNotas}">
            <div class="col-2" >
                <input type="text" class="form-control" id="nomeNota${contadorNotas}" placeholder="EX ${contadorNotas + 1}" value="EX ${contadorNotas + 1}" ${readonly}>
            </div>
            <div class="col-2">
                <input type="number" id="valorNota${contadorNotas}" class="form-control" onkeyup="somaNotasDistribuidas('${contadorNotas}')" value="${valorInicial}" placeholder="15.5" ${readonly}>
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
        loaderRun()
        $('#modal').modal('hide')
        AstNotif.notify('Sucesso', 'Notas distribuídas!')
    }).catch(error => {
        loaderRun()
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

var matriculas = {}
function lancaFrequencia(alunos={}, turma="", data='', confirma=false) {
    if (confirma) {
        if (data != '') {
            loader.style.display = 'block'
            loaderMsg.innerText = 'Lançando frequências...'
            console.log(data)
            

            turmasRef.child(turma + '/frequencia/' + data).set(alunos).then(() => {
                async function frequenciaAluno() {
                    for (const matricula in alunos) {
                        if (Object.hasOwnProperty.call(alunos, matricula)) {
                            const aluno = alunos[matricula];
                            turmasRef.child(turma + '/alunos/' + formataNumMatricula(matricula) + '/frequencia/' + data).set({turma: turma}).then(() => {
                                
        
                                
                            }).catch(error => {
                                AstNotif.dialog('Erro', error.message)
                                loaderRun()
                                console.log(error)
                            })
                        }
                    }
                }

                frequenciaAluno().then(() => {
                    AstNotif.dialog('Sucesso', 'As frequências foram lançadas com sucesso!')
                    carregaFrequenciaTurma(turma)
                    loaderRun()
                }).catch(error => {
                    AstNotif.dialog('Erro', error.message)
                    console.log(error)
                })
                
                
                loaderRun()
            }).catch(error => {
                AstNotif.dialog('Erro', error.message)
                console.log(error)
                loaderRun()
            })
        } else {
            AstNotif.dialog('Você não completou o campo data/hora', 'Por favor, defina dia e a hora que a frequência deve ser registrada.')
        }
        
    } else {
        let nomes = ''
        matriculas = {}
        console.log(alunos)
        console.log(turma)
        for (const matricula in alunos) {
            if (Object.hasOwnProperty.call(alunos, matricula)) {
                const aluno = alunos[matricula];
                nomes += formataNumMatricula(matricula) + ': ' + aluno + '<br>'
                matriculas[matricula] = aluno
            }
        }
        abrirModal('modal', 'Lançamento de frequência', 
            `Você selecionou os alunos listados abaixo da turma ${turma}. <br> ${nomes} <br><b>Escolha o dia e a hora que deseja lançar frequência.</b> (Por favor, lançe todos os dados corretamente)<br>
            <input type="datetime-local" class="form-control" name="dataFrequencia" id="dataFrequencia">
            `
            , `<button type="button" data-toggle="tooltip" data-placement="top" title="Lançar frequência para os alunos selecionados" class="btn btn-primary" onclick="lancaFrequencia(matriculas,'${turma}', document.getElementById('dataFrequencia').value, true)">Lançar</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
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

function deletaFrequencia(chave, turma) {
    async function deletaIndividual(matricula) {
        return turmasRef.child(`${turma}/alunos/${formataNumMatricula(matricula)}/frequencia/${chave}`).remove().then(()=> {
            return true
        }).catch(error => {
            throw new Error(error.message)
        }) 
    }
    turmasRef.child(turma + '/frequencia/' + chave).once('value').then(alunosLancados => {
        for (const matricula in alunosLancados.val()) {
            if (Object.hasOwnProperty.call(alunosLancados.val(), matricula)) {
                const nome = alunosLancados.val()[matricula];
                deletaIndividual(matricula).then(result => {
                    console.log(result)
                }).catch(error => {
                    AstNotif.dialog('Erro', error.message)
                    console.log(error)
                })
            }
        }
        turmasRef.child(turma + '/frequencia/' + chave).remove().then(() => {
            AstNotif.notify('Sucesso', 'Frequência deletada com sucesso')
            carregaFrequenciaTurma(alunosSelecionadosTurma.codTurma)
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
        })

        
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })
}

function carregaFrequenciaTurma(turma) {
    let divMapaFrequenciasTurma = document.getElementById('divMapaFrequenciasTurma')
    divMapaFrequenciasTurma.innerHTML = 'Nenhuma frequência foi lançada nesta turma'
    let c = 0
    document.getElementById('totalFrequenciasTurma').innerText = c
    document.getElementById('porcentagemFrequenciaTurma').innerText = 0 + '%'
    let qtdeAulas
    turmasRef.child(turma + '/status/qtdeAulas').once('value').then(qtdeDeAulas => {
        qtdeAulasFrequencia.innerText = qtdeDeAulas.val()
        qtdeAulas = qtdeDeAulas.val()
        document.getElementById('qtdeAulasFrequenciaTurma').innerText = qtdeAulas
        turmasRef.child(turma + '/frequencia').on('child_added', frequencia => {
            if (c == 0) {
                divMapaFrequenciasTurma.innerHTML = ''
            }
            let alunosPresentes = ''
            for (const matricula in frequencia.val()) {
                if (Object.hasOwnProperty.call(frequencia.val(), matricula)) {
                    const nome = frequencia.val()[matricula];
                    alunosPresentes += formataNumMatricula(matricula) + ': ' + nome.split(' ')[0] + " | "
                }
            }
            let diaFrequencia = frequencia.key.split('T')[0]
            let horaFrequencia = frequencia.key.split('T')[1]
            divMapaFrequenciasTurma.innerHTML += `
            <div class="row justify-content-start">
                <div class="col-auto" style="background-color: rgba(86,61,124,.15);border: 1px solid rgba(86,61,124,.2);"><a href="#tituloMapaFrequencias" onclick="deletaFrequencia('${frequencia.key}', '${alunosSelecionadosTurma.codTurma}')"><span data-feather="trash"></span></a>&nbsp;${diaFrequencia.split('-').reverse().join('/')} ás ${horaFrequencia}</div>
                <div class="col" style="background-color: rgba(86,61,124,.15);border: 1px solid rgba(86,61,124,.2);">${alunosPresentes}</div>
            </div>
            `
            feather.replace()
            c++
            document.getElementById('totalFrequenciasTurma').innerText = c
            document.getElementById('porcentagemFrequenciaTurma').innerText = ((100*parseInt(c))/parseInt(qtdeAulas)).toFixed(2) + '%'
        })
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
    })
    
}

function abreTurma(cod) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Abrindo turma...'
    carregaListaDeAlunosDaTurma(cod)
    carregaFrequenciaTurma(cod)
    var codigoDaTurmaLabel = document.getElementById('codigoDaTurma')
    var areaInfoTurma = document.getElementById('areaInfoTurma')
    turmasRef.child(cod).on('value', (snapshot) => {
        // TODO: Mostrar na tela as informações da turma
        console.log(snapshot.val())
        let dadosDaTurma = snapshot.val()
        codigoDaTurmaLabel.innerText = dadosDaTurma.codigoSala
        areaInfoTurma.style.visibility = 'visible'
        
        
        // Mostra dias de aula da turma
        document.getElementById('mostraDiasTurma').innerText = 'Dia(s) de Aula:'
        for (const key in dadosDaTurma.diasDaSemana) {
            if (Object.hasOwnProperty.call(dadosDaTurma.diasDaSemana, key)) {
                const dia = dadosDaTurma.diasDaSemana[key];
                let diasemana
                    switch(Number(dia)) {
                        case 0:
                            diasemana = 'Domingo'
                            break
                        case 1:
                            diasemana = 'Segunda'
                            break
                        case 2: 
                            diasemana = 'Terça'
                            break
                        case 3:
                            diasemana = 'Quarta'
                            break
                        case 4:
                            diasemana = 'Quinta'
                            break
                        case 5:
                            diasemana = 'Sexta'
                            break
                        case 6:
                            diasemana = 'Sábado'
                            break
                        default:
                            diasemana = ''
                            break
                    }
                document.getElementById('mostraDiasTurma').innerText += ' | ' + diasemana + ' '
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
        loaderRun()
        
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
        loaderRun()
        
    }).catch(function(error){
        AstNotif.dialog('Erro ao buscar CEP', error.message)
        console.log(error)
        loaderRun()
    })
}

//Funções da aba Alunos
var tipoDeBusca = 'nomeAluno'
function alteraTipoDeBusca(tipo) {
    tipoDeBusca = tipo
}



function carregaFrequenciaAluno(matricula, turma) {
    let c = 0
    let divFrequencias = document.getElementById('divFrequencias')
    let qtdeAulasFrequencia = document.getElementById('qtdeAulasFrequencia')
    let qtdeAulas
    turmasRef.child(turma + '/status/qtdeAulas').once('value').then(qtdeDeAulas => {
        qtdeAulasFrequencia.innerText = qtdeDeAulas.val()
        qtdeAulas = qtdeDeAulas.val()

        divFrequencias.innerHTML = 'Nenhuma frequência lançada para este aluno, nesta turma'
        turmasRef.child(turma + '/alunos/' + matricula + '/frequencia').on('child_added', frequencia => {
            console.log(frequencia.val())
            if (c==0) {
                divFrequencias.innerHTML = ''
            }
            if (frequencia.val().turma == turma) {
                let diaFrequencia = frequencia.key.split('T')[0]
                let horaFrequencia = frequencia.key.split('T')[1]
                divFrequencias.innerHTML += `
                <div class="row justify-content-start">
                    <div class="col-auto" style="background-color: rgba(86,61,124,.15);border: 1px solid rgba(86,61,124,.2);">${diaFrequencia.split('-').reverse().join('/')} ás ${horaFrequencia}</div>
                    <div class="col" style="background-color: rgba(86,61,124,.15);border: 1px solid rgba(86,61,124,.2);">Presente</div>
                </div>
                `
                feather.replace()
                $(function () {
                    $('[data-toggle="tooltip"]').tooltip()
                })
            }
            c++
            document.getElementById('totalFrequencias').innerText = c
            console.log(qtdeAulas)
            document.getElementById('porcentagemFrequencia').innerText = ((100*parseInt(c))/parseInt(qtdeAulas)).toFixed(2) + '%'
        })
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
    })


    
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
    carregaFrequenciaAluno(matricula, dados.turmaAluno)
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
    document.getElementById('mostraDataNascimentoAluno').innerText = dados.dataNascimentoAluno.split('-').reverse().join('/');

    let nascimento = dados.dataNascimentoAluno
    
    calcularIdadePrecisa(nascimento).then(function(idade){
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
    turmasRef.child(`${dados.turmaAluno}/alunos/${matricula}/notas`).on('value', (snapshot) => {
        turmasRef.child(`${dados.turmaAluno}/notas`).once('value').then(notasReferencia => {
            let notas = snapshot.val()
            let referenciaDeNotas = notasReferencia.val()
            if (desativado != false) {
                notas = notasDesativado
            }
            console.log(notas)
            let notasDoAlunoDiv = document.getElementById('notasDoAluno')
            notasDoAlunoDiv.innerHTML = ''
            //let somatorioNotasDiv = document.getElementById('somatorioNotas')
            if (notas == null) {
                notasDoAlunoDiv.innerHTML = 'Nenhuma nota foi lançada para este aluno<br>'
            }
            if (referenciaDeNotas == null) {
                notasDoAlunoDiv.innerHTML = 'Você não distribuiu notas para esta turma. Se aparecerem notas aqui abaixo, elas podem ter sido lançadas por outro professor.<br>'
            }
            let somatorioNotas = 0
            for (const nomeNota in notas) {
                if (Object.hasOwnProperty.call(notas, nomeNota)) {
                    const valorNota = notas[nomeNota];
                    try {
                        const barra = (100*valorNota)/referenciaDeNotas[nomeNota]
                        somatorioNotas += valorNota
                        notasDoAlunoDiv.innerHTML += `
                        
                        <small id="nomeNota${nomeNota}"><b>${nomeNota}</b>: ${valorNota}</small><small id="notaReferencia">/${referenciaDeNotas[nomeNota] == undefined ? 'Nota não lançada': referenciaDeNotas[nomeNota]}</small>
                        <div class="progress mb-3" style="height: 10px">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: ${barra}%" aria-valuenow="${valorNota}" aria-valuemin="0" aria-valuemax="${referenciaDeNotas[nomeNota]}">${valorNota}</div>
                        </div>
                        `
                    } catch (error) {
                        console.log(error)
                        somatorioNotas += valorNota
                        notasDoAlunoDiv.innerHTML += `
                        
                        <small id="nomeNota${nomeNota}"><b>${nomeNota}</b>: ${valorNota}</small><small id="notaReferencia">/?</small>
                        <div class="progress mb-3" style="height: 10px">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: 0%" aria-valuenow="${valorNota}" aria-valuemin="0" aria-valuemax="?">${valorNota}</div>
                        </div>
                        `
                    }
                   
                    
                }
            }
            let cor
            if (somatorioNotas >= 80) {
                cor = 'green'
            } else if (somatorioNotas <= 79 && somatorioNotas >= 60) {
                cor = 'gold'
            } else {
                cor = 'red'
            }
            notasDoAlunoDiv.innerHTML += `<div id="somatorioNotas">Somatório: <b style="color: ${cor}">${somatorioNotas}</b>/100</div>`

            
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        
        
    })


    turmasRef.child(`${dados.turmaAluno}/alunos/${matricula}/desempenho`).on('value', (desempenho) => {
        desempenhoRef.once('value').then(referenciaDesempenho => {
            let notas = desempenho.val()
            let referenciaDeNotas = referenciaDesempenho.val()
            console.log(notas)
            let notasDoAlunoDiv = document.getElementById('desempenhoAluno')
            notasDoAlunoDiv.innerHTML = ''
            //let somatorioNotasDiv = document.getElementById('somatorioNotas')
            if (notas == null) {
                notasDoAlunoDiv.innerHTML = 'Nenhuma nota de desempenho foi lançada para este aluno'
            }
            let somatorioNotas = 0
            for (const nomeNota in notas) {
                if (Object.hasOwnProperty.call(notas, nomeNota)) {
                    const valorNota = notas[nomeNota];
                    const barra = (100*valorNota)/referenciaDeNotas[nomeNota]
                    somatorioNotas += valorNota
                    notasDoAlunoDiv.innerHTML += `
                    
                    <small id="nomeDesempenho${nomeNota}"><b>${nomeNota}</b>: ${valorNota}</small><small id="notaReferencia">/${referenciaDeNotas[nomeNota]}</small>
                    <div class="progress mb-3" style="height: 10px">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${barra}%" aria-valuenow="${valorNota}" aria-valuemin="0" aria-valuemax="${referenciaDeNotas[nomeNota]}">${valorNota}</div>
                    </div>
                    `
                    
                }
            }
            
            notasDoAlunoDiv.innerHTML += `<div id="somatorioNotas">Somatório: <b>${somatorioNotas}</b></div>`

            
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        
    })
}

function lancaNotasDoAluno(turma, matricula) {
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
    let alunosSelec = {}
    alunosSelec[matricula] = ''

    var lancarNotas = firebase.functions().httpsCallable('lancarNotas')
    
    lancarNotas({alunos: alunosSelec, turma: turma, notas: notasParaLancar}).then(function(result){
        AstNotif.dialog('Aguarde...', result.data.answer)
        $('#modal').modal('hide')
        loaderRun()
    }).catch(function(error){
        loaderRun()
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })
}

function editaNotasAluno(matricula, turma) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Buscando notas...'
    turmasRef.child(`${turma}/alunos/${matricula}/notas`).once('value').then(notasAluno => {
        turmasRef.child(`${turma}/notas`).once('value').then(notasReferencia => {
            loaderRun()
            let notasDoAluno = notasAluno.val()
            let notasDeReferencia = notasReferencia.val()
            let notasDistribuidas

            abrirModal('modal', 'Lançando notas para matrícula ' + matricula, 
                `
                <div class="row" id="linha">
                    <div class="col-2" >
                        <b>Identificação da nota</b>
                    </div>
                    <div class="col-2">
                        <b>Valor Total</b>
                    </div>
                    <div class="col-2">
                        <b>Nota do aluno</b>
                    </div>
                </div>
                <section id="camposLancaNotas"></section>
                `
                , `<button type="button" data-toggle="tooltip" data-placement="top" title="Lançar notas para o aluno" class="btn btn-primary" onclick="lancaNotasDoAluno('${turma}', '${matricula}')">Lançar</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
            )
            if (notasDeReferencia != null) {
                notasDistribuidas = notasDeReferencia
            } else {
                AstNotif.dialog('Espera aí', 'Você não distribuiu notas nesta turma. Volte na turma e clique em "Distribuir notas".')
            }
            
            let c = 0
            for (let nomeNota in notasDeReferencia) {
                if (Object.hasOwnProperty.call(notasDeReferencia, nomeNota)) {
                    const valor = notasDeReferencia[nomeNota];
                    let readonly = ''
                    let disabled = ''
                    let tooltip = ''
                    if (nomeNota == 'Desempenho') {
                        readonly = 'readonly'
                        disabled = 'disabled'
                        tooltip = 'data-toggle="tooltip" data-placement="top" title="Esta nota deve ser alterada no Desempenho do Aluno."'
                    }
                    document.getElementById('camposLancaNotas').innerHTML += `
                    <div class="row" id="linha${c}">
                        <div class="col-2" >
                            <input type="text" class="form-control" id="nomeNota${c}" placeholder="EX ${c + 1}" value="${nomeNota}" readonly>
                        </div>
                        <div class="col-2">
                            Total: ${valor}
                        </div>
                        <div class="col-2">
                            
                            <input type="number" min="0" max="${valor}" id="valorNota${c}" value="0" class="form-control"  placeholder="Total: ${valor}" onkeyup='this.value > ${valor} || this.value == "" ? this.value = 0: console.log("ok")' ${readonly} ${tooltip}>
                        </div>
                        <button type="button" class="btn btn-light btn-sm ${disabled}" ${disabled} onclick="document.getElementById('valorNota${c}').value = ${valor}">Dar Total</button><br>
                    </div>
                    `
                    c++
                }
            }
            $(function () {
                $('[data-toggle="tooltip"]').tooltip()
            })
            contadorDeNotas = c
            
            let c4 = 0
            for (const nomeNota in notasDoAluno) {
                if (Object.hasOwnProperty.call(notasDoAluno, nomeNota)) {
                    const valor = notasDoAluno[nomeNota];
                    if (nomeNota != document.getElementById('nomeNota' + c4).value) {
                        try {
                            document.getElementById('valorNota' + (c4 + 1)).value = valor
                        } catch (error) {
                            console.log(error)
                            AstNotif.dialog('Aviso', 'Existem notas divergentes para este aluno. Isso pode acontecer quando o aluno é transferido de uma turma para outra e o professor da turma anterior já tiver lançado alguma nota para o aluno. <b>É recomendado corrigir as notas do aluno o quanto antes para evitar problemas de lançamento no sistema.</b>')
                        }
                        
                        c4++
                    } else {
                        console.log(valor)
                        console.log(c4)
                        document.getElementById('valorNota' + c4).value = valor
                        c4++
                    }
                }
            }
            

        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            loaderRun()
            console.log(error)
        })
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        loaderRun()
        console.log(error)
    })
}

function lancaDesempenho(matricula='', turma='', confirma=false, FALE={}) {
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

        turmasRef.child(`${turma}/alunos/${matricula}/desempenho`).set(notasParaLancar).then(() => {
            $('#modal').modal('hide')
            loaderRun()
            AstNotif.notify('Sucesso', 'Desempenho do aluno alterado com sucesso.')

        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            loaderRun()
            console.log(error)
        })
    } else {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Buscando notas...'
        turmasRef.child(`${turma}/alunos/${matricula}/desempenho`).once('value').then(notasAluno => {
            desempenhoRef.once('value').then(referenciaDesempenho => {
                loaderRun()
                let notasDoAluno = notasAluno.val()
                let notasDeReferencia = referenciaDesempenho.val()

                abrirModal('modal', 'Lançar desempenho', `
                <section id="camposLancaNotas"></section> 
                `, `<button type="button" data-toggle="tooltip" data-placement="top" title="Lançar notas para os alunos selecionados" class="btn btn-primary" onclick="lancaDesempenho('${matricula}', '${turma}', true)">Lançar</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`)
                
                
                let c = 0
                for (const nomeNota in notasDeReferencia) {
                    if (Object.hasOwnProperty.call(notasDeReferencia, nomeNota)) {
                        const valor = notasDeReferencia[nomeNota];
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
                
                let c4 = 0
                for (const nomeNota in notasDoAluno) {
                    if (Object.hasOwnProperty.call(notasDoAluno, nomeNota)) {
                        const valor = notasDoAluno[nomeNota];
                        console.log(nomeNota)
                        if (nomeNota != document.getElementById('nomeNota' + c4).value) {
                            document.getElementById('valorNota' + (c4 + 1)).value = valor
                            c4++
                        } else {
                            console.log(valor)
                            console.log(c4)
                            document.getElementById('valorNota' + c4).value = valor
                            c4++
                        }
                        
                    }
                }
            })
            
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            loaderRun()
            console.log(error)
        })
    }
}

function followUpAluno(matricula) {
    
    if (matricula == '00000' || matricula == '') {
        AstNotif.dialog('Atenção', 'Você deve clicar em um aluno para descrever um follow up.')
        loaderRun()
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
                    loaderRun()
                }).catch(error =>{
                    AstNotif.dialog('Erro', error.message)
                    console.log(error)
                    loaderRun()
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
        loaderRun()
    }).catch((error) => {
        console.log(error)
        AstNotif.dialog('Erro', error.message)
        loaderRun()
    })
}

function verFollowUp(id) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando FollowUp...'
    followUpRef.child(id).once('value').then(snapshot => {
        AstNotif.dialog(snapshot.val().titulo, snapshot.val().descricao + ' <br><br> <b>Autor do FollowUp:</b> ' + snapshot.val().autor, {positive: "OK",negative: ''})

        loaderRun()
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loaderRun()
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

function historicoAluno(matricula, turma) {
    
    abrirModal('modal', 'Histórico escolar', 
            `
            <div class="container-xl">
            <div class="table-responsive">
              <div class="table-wrapper">
                <div class="table-title">
                  <div class="row">
                    <div class="col-sm-6">
                      <h2>Histórico <b>Escolar</b></h2>
                    </div>
                    <div class="col-sm-6">
                      <!--<a href="#" class="btn btn-success" onclick="carregaListaDeAlunos()">&nbsp; <span class="feather-24" data-feather="refresh-cw"></span><span>Atualizar lista</span></a>
                      <a href="#deleteEmployeeModal" class="btn btn-danger" data-toggle="modal">&nbsp;<span class="feather-24" data-feather="trash"></span> <span>Delete</span></a>-->						
                    </div>
                  </div>
                </div>
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>
                        <span class="custom-checkbox">
                          <input type="checkbox" id="selectAll">
                          <label for="selectAll"></label>
                        </span>
                      </th>
                      <th><a href="#" id="ordenaTurma">Turma</a></th>
                      <th><a href="#" id="ordenaData">Data de fechamento</a></th>
                      <th><a href="#" id="ordenaNota">Somatório das notas</a></th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody id="listaHistorico">
                    
                  </tbody>
                </table>
                
              </div>
            </div>
          </div>    

            `, `<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>`
        )
        let listaHistorico = document.getElementById('listaHistorico')
        let c = 0
    alunosRef.child(matricula + '/historicoEscolar').on('child_added', (registro) => {
        
        c++
        let dataFechamento = new Date(registro.val().timestamp._seconds * 1000)
        let notas = registro.val().infoAluno.notas
        let somatorioNota = 0
        for (const nomeNota in notas) {
            if (Object.hasOwnProperty.call(notas, nomeNota)) {
                const nota = notas[nomeNota];
                somatorioNota += nota
            }
        }
        listaHistorico.innerHTML += `
        <tr>
            <td>
                <span class="custom-checkbox">
                    <input type="checkbox" id="checkbox${c}" name="options[]" value="1">
                    <label for="checkbox${c}"></label>
                </span>
            </td>
            <td>${registro.val().turma}</td>
            <td>${dataFechamento.getDate()}/${dataFechamento.getMonth() + 1}/${dataFechamento.getFullYear()}</td>
            <td><b>${somatorioNota}</b>/100</td>
            <td>
                <a id="emiteBoletim${c}" onclick="emiteBoletim('${matricula}', '${registro.key}')" class="action" data-toggle="modal"><i data-feather="file-text" data-toggle="tooltip" title="Emitir boletim"></i></a>
                <a href="#" id="verHistorico${c}" class="edit" data-toggle="modal"><i data-feather="eye" data-toggle="tooltip" title="Visualizar dados"></i></a>
            </td>
        </tr>
        `
        document.querySelector('#verHistorico' + c).addEventListener('click', (e) => {
            e.preventDefault()
            visualizarDadosDoHistorico(registro.val())
        })

        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
        feather.replace()
        loaderRun()
        ativaCheckboxes()
    })
}

function emiteBoletim(matricula, chave) {
    document.getElementById('corpoBoletim').innerHTML = `<iframe src="../resources/pdfsProntos/documento.html#boletim?${matricula}?${chave}" frameborder="0" width="100%" height="300px" id="boletimPdf" name="boletimPdf"></iframe>`
    $('#boletimModal').modal({backdrop: 'static'})
}


// Funções Aba Financeiro
async function carregaFinanceiro() {
    loaderRun(true, 'Carregando dados financeiros...')
    let cursosFirebase = await cursosRef.once('value')
    let cursos = cursosFirebase.val()
    let listaPlanosCurso = document.getElementById('listaPlanosCurso')
    let listaCursos = document.getElementById('listaCursos')
    let cursoAtual
    console.log(cursos)
    mostraCursos(cursos)

    async function refresh() {
        loaderRun(true, 'Atualizando planos...')
        cursos = (await cursosRef.once('value')).val()
        loaderRun()
        return ;
    }
    
    function mostraCursos(cursos) {
        
        listaCursos.innerHTML = '<option selected hidden value="">Escolha um curso...</option>'
        let c = 0
        cursos.forEach(curso => {
            listaCursos.innerHTML += `
                <option value="${curso.codSistema}">${curso.nomeCurso}</option>
            `
            c++
        });
    }

    function mostraPlanos(codSistema) {
        let planos = cursos[codSistema].planos
        let c = 0
        listaPlanosCurso.innerHTML = ''
        if (planos == undefined) {
            AstNotif.notify('Falha', 'Não existem planos cadastrados para este curso.')
            listaPlanosCurso.innerHTML = 'Vazio'
        }
        for (const key in planos) {
            if (Object.hasOwnProperty.call(planos, key)) {
                const plano = planos[key];
                listaPlanosCurso.innerHTML += `
                <tr>
                    <td>
                        <span class="custom-checkbox">
                            <input type="checkbox" id="checkbox${c}" name="options[]" value="${c}">
                            <label for="checkbox${c}"></label>
                        </span>
                    </td>
                    <td>${plano.nomePlano}</td>
                    <td>${plano.valorFinal}</td>
                    <td>${plano.adesoes == undefined ? 0 : plano.adesoes}</td>
                    <td>
                        <a href="#editEmployeeModal" id="${key}" name="deletePlan" class="delete" data-toggle="tooltip" title="Deletar plano"><i id="${key}" data-feather="trash"></i></a>
                        <!--<a href="#deleteEmployeeModal" class="delete" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Deletar">&#xE872;</i></a>-->
                    </td>
                </tr>
                `
                c++
            }
        }
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
        feather.replace()
        
        document.getElementsByName('deletePlan').forEach(elem => {
            elem.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                let key = e.target.id
                if (key != '') {
                    console.log(key)
                    deletaPlano(key)
                }
                
            })
        })
    }

    async function deletaPlano(key) {
        console.log(key)
        const confirm = await ui.confirm('Você confirma a exclusão desse plano? Esta ação não é reversível');
        if (confirm) {
            try {
                loaderRun(true, 'Excluindo plano...')
                await cursosRef.child(cursoAtual).child('planos').child(key).remove()
                AstNotif.notify('Sucesso', 'Plano deletado com sucesso', 'agora')
                await refresh()
                mostraPlanos(cursoAtual)
                loaderRun()
            } catch (error) {
                AstNotif.dialog('Erro', error.message)
                console.log(error)
                loaderRun()
            }
        }
        
        

    }

    
    
    document.getElementById('btnAddPlano').addEventListener('click', (e) => {
        if (listaCursos.value == '') {
            AstNotif.dialog('Erro', 'Você esqueceu de selecionar um curso. Escolha um curso para poder adicionar um plano.')
        } else {
            let codSistema = listaCursos.value
            let curso = cursos[codSistema]
            abrirModal('modal', 'Adicionar plano ao curso ' + curso.nomeCurso, `
            <form id="addPlanoCurso">
            <h3>Dados do Curso</h3>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="inputEmail4">Nome do curso</label>
                        <input type="text" class="form-control" id="nomeCursoAdd" name="nomeCursoAdd" value="${curso.nomeCurso}" placeholder="Nome do curso (Ex.: Inglês Básico para Adultos)" readonly>
                        <small id="idCursoHElp" class="form-text text-muted">Identificação que aparece nos boletins e nos demais documentos emitidos pelo sistema.</small>
                    </div>
                    <div class="form-group col-md-6">
                        <label for="exampleInputEmail1">Código</label>
                        <input type="text" required class="form-control" value="${curso.codCurso}" id="codigoCursoAdd" name="codigoCursoAdd" aria-describedby="nomeEscola" placeholder="Código do Curso" readonly>
                        <small id="nomeEscolaHElp" class="form-text text-muted">Código utilizado para formar os códigos automáticos de turma.</small>  
                    </div>
                </div>
                <hr>
                <h3>Dados do Plano</h3>
                <small id="idPlano" class="form-text text-muted">Os dados do plano serão utilizados para geração de boletos no momento da matrícula de um aluno. Todos os valores brutos estão em R$ (BRL - Brazilian Real / Real Brasileiro)</small>
                <div class="form-row">
                    <div class="form-group col-md-3">
                        <label for="inputEmail4">Nome do Plano *</label>
                        <input type="text" required class="form-control" id="nomePlano" name="nomePlano" placeholder="Nome do plano (Ex.: Promoção Gold)">
                        <small id="idPlano" class="form-text text-muted">Este nome ajudará a secretaria a identificar mais os planos para realizar as matrículas de novos estudantes.</small>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="exampleInputEmail1">Valor integral do Curso *</label>
                        <input type="number" required class="form-control" id="valorCurso" name="valorCurso" aria-describedby="valorCurso" placeholder="Valor do curso">
                        <small id="nomeEscolaHElp" class="form-text text-muted">Valor integral do curso sem descontos.</small>  
                    </div>
                    <div class="form-group col-md-3">
                        <label for="inputEmail4">Desconto (%)</label>
                        <input type="number" class="form-control" id="descontoPlano" name="descontoPlano" placeholder="Desconto em % (Ex.: 50)">
                        <small id="idPlano" class="form-text text-muted">Desconto nesse plano do curso em porcentagem com base no valor integral do curso. (Digite apenas números)</small>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="exampleInputEmail1">Valor do desconto</label>
                        <input type="text" required class="form-control" id="valorDesconto" name="valorDesconto" aria-describedby="nomeEscola" placeholder="Valor do desconto" readonly>
                        <small id="nomeEscolaHElp" class="form-text text-muted">O valor calculado do desconto aplicado.</small>  
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-3">
                        <label for="exampleInputEmail1">Acréscimo (%)</label>
                        <input type="text" class="form-control" id="acrescimoPlano" name="acrescimoPlano" aria-describedby="nomeEscola" placeholder="Desconto em % (Ex.: 5)">
                        <small id="nomeEscolaHElp" class="form-text text-muted">Acréscimos nesse plano do curso em porcentagem com base no valor integral do curso. (Digite apenas números)</small>  
                    </div>
                    <div class="form-group col-md-3">
                        <label for="exampleInputEmail1">Valor do Acréscimo</label>
                        <input type="text" required class="form-control" id="valorAcrescimo" name="valorAcrescimo" aria-describedby="nomeEscola" placeholder="Valor do desconto" readonly>
                        <small id="nomeEscolaHElp" class="form-text text-muted">O valor calculado do acréscimo aplicado.</small>  
                    </div>
                    <div class="form-group col-md-3">
                        
                    </div>
                    <div class="form-group col-md-3">
                        <label for="inputEmail4">Valor integral final</label>
                        <input type="number" class="form-control" id="valorFinal" name="valorFinal" placeholder="Valor integral final" readonly>
                        <small id="idPlano" class="form-text text-muted" >Valor integral final calculado do curso utilizando-se deste plano no momento da matrícula.</small>
                    </div>
                </div>
                <h5>Parcelas</h5>
                <div class="form-row">
                    <div class="form-group col-md-4">
                        <label for="inputEmail4">Nº máximo de parcelas *</label>
                        <input type="number" required class="form-control" id="numeroMaximoParcelasPlano" name="numeroMaximoParcelasPlano" placeholder="Nº máximo de parcelas">
                        <small id="idPlano" class="form-text text-muted">Número máximo de parcelas para este plano.</small>
                        <div class="form-group form-check">
                            <input type="checkbox" class="form-check-input" id="distribuirAcrescimosEDescontos" name="distribuirAcrescimosEDescontos">
                            <label class="form-check-label" for="exampleCheck1">Aplicar os <b>descontos e acréscimos</b> distribuídos nas parcelas</label>
                        </div>
                    </div>
                    <div class="form-group col-md-2">
                        <label for="inputEmail4">Aplicar apartir da:</label>
                        <select class="form-control" id="quandoAplicar" name="quandoAplicar" disabled>
                            
                        </select>
                        <small id="idPlano" class="form-text text-muted">A partir de qual parcela começar a aplicar os descontos e acréscimos. Isso forçará os contratos à terem um número mínimo de parcelas.</small>
                    </div>
                    <div class="form-group col-md-5">
                        <label for="exampleFormControlSelect2">Detalhamento de exemplo utilizando-se o máximo de parcelas</label>
                        <select multiple class="form-control" id="detalhamentoParcelas" name="detalhamentoParcelas">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                        </select>
                    </div>
                </div>
                <h5>Vencimento</h5>
                <div class="form-row">
                    <div class="form-group col-md-4">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="vencimento" id="permitirDefinirVencimento1" value="false" checked>
                            <label class="form-check-label" for="exampleRadios1">
                            Permitir definir vencimento no ato da matrícula
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="vencimento" id="definirVencimentoEspecifico" value="true">
                            <label class="form-check-label" for="exampleRadios2">
                            Definir datas específicas para o vencimento
                            </label>
                        </div>
                        <label for="inputEmail4">Adicione um dia</label>
                        <div class="input-group mb-3">
                            <input type="number" class="form-control" id="addDatasVencimento" name="addDatasVencimento" placeholder="Digite um dia (Ex.: 10)" disabled>
                            <div class="input-group-append">
                                <button class="btn btn-primary" type="button" id="btnAddDia" disabled><span data-feather="plus"></span>Adicionar</button>
                            </div>
                        </div>
                        
                        <small id="idPlano" class="form-text text-muted">Adicione os dias possíveis para vencimento.</small>
                    </div>
                    <div class="form-group col-md-2">
                        <label for="exampleFormControlSelect2">Dias escolhidos</label>
                        <select multiple class="form-control" id="diasDeVencimento" name="diasDeVencimento" disabled>
                            
                        </select>
                        <small id="idPlano" class="form-text text-muted">Clique em um dia para removê-lo.</small>
                    </div>
                    
                </div>
                <div class="form-row">
                    
                    <div class="form-group col-md-10">
                        <label for="exampleFormControlSelect2">Informações e Avisos</label>
                        <input class="form-control" type="text" id="descricaoPlano" name="descricaoPlano" placeholder="Informações e Avisos (Ex.: Em caso de atraso no pagamento será cobrado...)">
                        <small class="form-text text-muted">Estas informações aparecerão impressas em cada parcela de pagamento.</small>
                    </div>
                        
                </div>
                
              
              <button type="submit" class="btn btn-primary btn-block">Adicionar plano</button>
            </form>
            `, `<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>`)

            feather.replace()

            document.getElementsByName('vencimento').forEach(element => {
                element.addEventListener('click', (e) => {
                    console.log(e.target.value, e.target.checked)
                    if (e.target.value == 'false' && e.target.checked == true) {
                        document.getElementById('btnAddDia').disabled = true
                        document.getElementById('diasDeVencimento').disabled = true
                        document.getElementById('addDatasVencimento').disabled = true
                    } else {
                        document.getElementById('btnAddDia').disabled = false
                        document.getElementById('diasDeVencimento').disabled = false
                        document.getElementById('addDatasVencimento').disabled = false
                        document.getElementById('diasDeVencimento').innerHTML = ''
                    }
                })
            })

            document.getElementById('btnAddDia').addEventListener('click', (e) => {
                let dia = document.getElementById('addDatasVencimento')
                addDia(dia.value)
                dia.value = ''
            })
            
            function addDia(dia) {
                if (dia < 1 || dia > 28) {
                    AstNotif.dialog('Opa...', 'Por favor, escolha um dia entre os dias 1 e 28')
                } else {
                    document.getElementById('diasDeVencimento').innerHTML += `<option onclick="this.remove()" id="dia${dia}" value="${dia}" selected>${dia}</option>`
                }
            }

            function addParcela(dadosParcela='') {
                if (dadosParcela == '') {
                    document.getElementById('detalhamentoParcelas').innerHTML = ''
                } else {
                    document.getElementById('detalhamentoParcelas').innerHTML += `<option>${dadosParcela}</option>`
                }
                
            }

            let formAddPlanoCurso = document.getElementById('addPlanoCurso')
            formAddPlanoCurso.addEventListener('change', async (e) => {
                let dadosForm = $("#addPlanoCurso").serializeArray()
                let formData = new FormData(formAddPlanoCurso)
                // Objeto contendo os dados do plano par enviar ao firebase
                let data = {}
                console.log(dadosForm)
                dadosForm.forEach(field => {
                    let values = formData.getAll(field.name)
                    values.length == 1 ? data[field.name] = values[0] : data[field.name] = values
                })
                console.log(data)
                try {
                    data.valorDesconto = (Number(data.valorCurso) * (data.descontoPlano/100)).toFixed(2)
                    data.valorAcrescimo = (Number(data.valorCurso) * (data.acrescimoPlano/100)).toFixed(2)
                    data.valorFinal = (Number(data.valorCurso) + (data.valorAcrescimo - data.valorDesconto)).toFixed(2)
                    addParcela()
                    document.getElementById('quandoAplicar').innerHTML = '<option hidden selected>Escolha a parcela...</option>'
                    for (let i = 0; i < data.numeroMaximoParcelasPlano; i++) {
                        document.getElementById('quandoAplicar').innerHTML += `<option value="${i}">Parcela ${i + 1}</option>`
                    }
                    let saldo = data.valorCurso
                    let saldoAcrescimo = data.valorAcrescimo
                    let saldoDesconto = data.valorDesconto
                    let contadorParcelas = data.numeroMaximoParcelasPlano
                    let somaParcelas = 0
                    let valorParcelaGlobal = 0
                    for (let parcela = 0; parcela < data.numeroMaximoParcelasPlano; parcela++) {
                        let parcelaText
                        if (data.distribuirAcrescimosEDescontos == 'on') {
                            document.getElementById('quandoAplicar').disabled = false
                            
                            
                            let acrescimoParcela 
                            let descontoParcela 
                            let valorParcela
                            parcela == 0 ? valorParcelaGlobal = parseFloat(saldo / contadorParcelas).toFixed(2) : null
                            if (parcela >= data.quandoAplicar) {
                                // parcela == data.quandoAplicar ? saldo = data.valorFinal - somaParcelas : null
                                parcela == data.quandoAplicar ? valorParcelaGlobal = parseFloat(saldo / contadorParcelas).toFixed(2) : null
                                valorParcela = valorParcelaGlobal
                                acrescimoParcela = (saldoAcrescimo/contadorParcelas).toFixed(2)
                                descontoParcela = (saldoDesconto/contadorParcelas).toFixed(2)
                                // saldo = (Number(saldo) - valorParcela) - Number(acrescimoParcela - descontoParcela)
                            } else {
                                valorParcela = valorParcelaGlobal
                                
                                // saldo = saldo - valorParcela
                                acrescimoParcela = 0
                                descontoParcela = 0
                            }
                            
                            saldoAcrescimo = saldoAcrescimo - acrescimoParcela
                            saldoDesconto = saldoDesconto - descontoParcela
                            
                            data.quandoAplicar != undefined ? parcelaText = `Parcela ${parcela + 1}: R$${valorParcela} ${acrescimoParcela != 0 || acrescimoParcela != '' ? '+ R$' + acrescimoParcela : ''} ${descontoParcela != 0 || descontoParcela != '' ? '- R$' + descontoParcela : ''} = R$${(Number(valorParcela) + (acrescimoParcela - descontoParcela)).toFixed(2)}` : null
                            somaParcelas += (Number(valorParcela) + (acrescimoParcela - descontoParcela))
                        } else {
                            parcela == 0 ? saldo = data.valorFinal : null
                            document.getElementById('quandoAplicar').disabled = true
                            document.getElementById('quandoAplicar').innerHTML = ''
                             parcelaText = `Parcela ${parcela + 1}:  R$${parseFloat(data.valorFinal / data.numeroMaximoParcelasPlano).toFixed(2)}`
                            // saldo = saldo - parseFloat(data.valorFinal / data.numeroMaximoParcelasPlano).toFixed(2)
                            somaParcelas += Number(parseFloat(data.valorFinal / data.numeroMaximoParcelasPlano))
                        }
                        saldo = (parcela >= data.quandoAplicar ? data.valorFinal : data.valorCurso) - somaParcelas
                        console.log(saldo)
                        addParcela(parcelaText)
                        // addParcela(`Saldo: R$${saldo}`)
                        contadorParcelas--
                    }
                    addParcela(`Total: R$${somaParcelas.toFixed(2)}`)

                } catch (error) {
                    console.log(error)
                }

                for (const id in data) {
                    if (Object.hasOwnProperty.call(data, id)) {
                        const value = data[id];
                        id == 'vencimento' ? document.getElementsByName(id).value = value : document.getElementById(id).value = value
                    }
                }
            })
            

            formAddPlanoCurso.addEventListener('submit', (e) => {
                e.preventDefault()
                loaderRun(true, 'Enviando dados do plano...')
                let obj = document.getElementById('diasDeVencimento')
                try {
                    for (var i = 0; i < obj.options.length; i++) {
                        obj.options[i].selected = true;
                    }  
                } catch (error) {
                    console.log(error)
                }
                
                
                
                let dadosForm = $("#addPlanoCurso").serializeArray()
                let formData = new FormData(formAddPlanoCurso)
                let data = {}
                console.log(dadosForm)
                dadosForm.forEach(field => {
                    let values = formData.getAll(field.name)
                    values.length == 1 ? data[field.name] = values[0] : data[field.name] = values
                })
                data.codCurso = codSistema
                console.log(data)
                cursosRef.child(listaCursos.value + '/planos').push(data).then(async () => {
                    loaderRun()
                    AstNotif.notify('Sucesso', 'Dados enviados com sucesso!')
                    $('#modal').modal('hide')
                    await refresh()
                    mostraPlanos(cursoAtual)
                }).catch(error => {
                    AstNotif.dialog('Erro', error.message)
                })
            })


        }
        
    })

    listaCursos.addEventListener('change', (e) => {
        let codSistema = e.target.value
        cursoAtual = codSistema
        mostraPlanos(codSistema)
    })

    

    loaderRun()
}

// Funcções Aba Contratos
async function carregaContratos(filtro=null) {
    loaderRun(true, 'Carregando dados dos contratos...')
    
    let listaContratos = document.getElementById('listaContratos')
    
    mostraContratos(filtro)

    async function mostraContratos(filtro) {
        let contratosFirebase = filtro == null ? await contratosRef.orderByChild('matricula').once('value') : await contratosRef.orderByChild('matricula').equalTo(filtro).once('value')
        let contratos = contratosFirebase.val()
        let c = 0
        listaContratos.innerHTML = ''
        if (contratos == undefined) {
            AstNotif.notify('Falha', 'Não existem contratos cadastrados')
            listaContratos.innerHTML = 'Vazio'
        }
        for (const key in contratos) {
            if (Object.hasOwnProperty.call(contratos, key)) {
                const contrato = contratos[key];
                listaContratos.innerHTML += `
                <tr>
                    <td>
                        <span class="custom-checkbox">
                            <input type="checkbox" id="checkbox${c}" name="options[]" value="${c}">
                            <label for="checkbox${c}"></label>
                        </span>
                    </td>
                    <td>${contrato.matricula}</td>
                    <td>${contrato.contratoConfigurado.nomePlano}</td>
                    <td>?/${contrato.contratoConfigurado.numeroParcelas}</td>
                    <td>${contrato.situacao}</td>
                    <td>
                        <a href="#editEmployeeModal" class="action" data-toggle="modal"><i data-feather="edit" data-toggle="tooltip" title="Reativar aluno">&#xE254;</i></a>
                        <a href="#deleteEmployeeModal" class="delete" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Deletar">&#xE872;</i></a>
                    </td>
                </tr>
                `
                c++
            }
        }
        
    }
    
    document.getElementById('btnAddPlano').addEventListener('click', (e) => {
        if (listaCursos.value == '') {
            AstNotif.dialog('Erro', 'Você esqueceu de selecionar um curso. Escolha um curso para poder adicionar um plano.')
        } else {
            let codSistema = listaCursos.value
            let curso = cursos[codSistema]
            abrirModal('modal', 'Adicionar plano ao curso ' + curso.nomeCurso, `
            <form id="addPlanoCurso">
            <h3>Dados do Curso</h3>
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="inputEmail4">Nome do curso</label>
                        <input type="text" class="form-control" id="nomeCursoAdd" name="nomeCursoAdd" value="${curso.nomeCurso}" placeholder="Nome do curso (Ex.: Inglês Básico para Adultos)" readonly>
                        <small id="idCursoHElp" class="form-text text-muted">Identificação que aparece nos boletins e nos demais documentos emitidos pelo sistema.</small>
                    </div>
                    <div class="form-group col-md-6">
                        <label for="exampleInputEmail1">Código</label>
                        <input type="text" required class="form-control" value="${curso.codCurso}" id="codigoCursoAdd" name="codigoCursoAdd" aria-describedby="nomeEscola" placeholder="Código do Curso" readonly>
                        <small id="nomeEscolaHElp" class="form-text text-muted">Código utilizado para formar os códigos automáticos de turma.</small>  
                    </div>
                </div>
                <hr>
                <h3>Dados do Plano</h3>
                <small id="idPlano" class="form-text text-muted">Os dados do plano serão utilizados para geração de boletos no momento da matrícula de um aluno. Todos os valores brutos estão em R$ (BRL - Brazilian Real / Real Brasileiro)</small>
                <div class="form-row">
                    <div class="form-group col-md-3">
                        <label for="inputEmail4">Nome do Plano *</label>
                        <input type="text" required class="form-control" id="nomePlano" name="nomePlano" placeholder="Nome do plano (Ex.: Promoção Gold)">
                        <small id="idPlano" class="form-text text-muted">Este nome ajudará a secretaria a identificar mais os planos para realizar as matrículas de novos estudantes.</small>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="exampleInputEmail1">Valor integral do Curso *</label>
                        <input type="number" required class="form-control" id="valorCurso" name="valorCurso" aria-describedby="valorCurso" placeholder="Valor do curso">
                        <small id="nomeEscolaHElp" class="form-text text-muted">Valor integral do curso sem descontos.</small>  
                    </div>
                    <div class="form-group col-md-3">
                        <label for="inputEmail4">Desconto (%)</label>
                        <input type="text" class="form-control" id="descontoPlano" readonly name="descontoPlano" placeholder="Desconto em % (Ex.: 50)">
                        <small id="idPlano" class="form-text text-muted">Desconto nesse plano do curso em porcentagem com base no valor integral do curso.</small>
                    </div>
                    <div class="form-group col-md-3">
                        <label for="exampleInputEmail1">Valor do desconto</label>
                        <input type="text" required class="form-control" id="valorDesconto" name="valorDesconto" aria-describedby="nomeEscola" placeholder="Valor do desconto.">
                        <small id="nomeEscolaHElp" class="form-text text-muted">Digite o valor do desconto.</small>  
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group col-md-3">
                        <label for="exampleInputEmail1">Acréscimo (%)</label>
                        <input type="text" class="form-control" id="acrescimoPlano" name="acrescimoPlano" aria-describedby="nomeEscola" placeholder="Desconto em % (Ex.: 5)">
                        <small id="nomeEscolaHElp" class="form-text text-muted">Acréscimos nesse plano do curso em porcentagem com base no valor integral do curso. (Digite apenas números)</small>  
                    </div>
                    <div class="form-group col-md-3">
                        <label for="exampleInputEmail1">Valor do Acréscimo</label>
                        <input type="text" required class="form-control" id="valorAcrescimo" name="valorAcrescimo" aria-describedby="nomeEscola" placeholder="Valor do desconto" readonly>
                        <small id="nomeEscolaHElp" class="form-text text-muted">O valor calculado do acréscimo aplicado.</small>  
                    </div>
                    <div class="form-group col-md-3">
                        
                    </div>
                    <div class="form-group col-md-3">
                        <label for="inputEmail4">Valor integral final</label>
                        <input type="number" class="form-control" id="valorFinal" name="valorFinal" placeholder="Valor integral final" readonly>
                        <small id="idPlano" class="form-text text-muted" >Valor integral final calculado do curso utilizando-se deste plano no momento da matrícula.</small>
                    </div>
                </div>
                <h5>Parcelas</h5>
                <div class="form-row">
                    <div class="form-group col-md-4">
                        <label for="inputEmail4">Nº máximo de parcelas *</label>
                        <input type="number" required class="form-control" id="numeroMaximoParcelasPlano" name="numeroMaximoParcelasPlano" placeholder="Nº máximo de parcelas">
                        <small id="idPlano" class="form-text text-muted">Número máximo de parcelas para este plano.</small>
                        <div class="form-group form-check">
                            <input type="checkbox" class="form-check-input" id="distribuirAcrescimosEDescontos" name="distribuirAcrescimosEDescontos">
                            <label class="form-check-label" for="exampleCheck1">Aplicar os <b>descontos e acréscimos</b> distribuídos nas parcelas</label>
                        </div>
                    </div>
                    <div class="form-group col-md-2">
                        <label for="inputEmail4">Aplicar a partir da:</label>
                        <select class="form-control" id="quandoAplicar" name="quandoAplicar" disabled>
                            
                        </select>
                        <small id="idPlano" class="form-text text-muted">A partir de qual parcela começar a aplicar os descontos e acréscimos. Isso forçará os contratos à terem um número mínimo de parcelas.</small>
                    </div>
                    <div class="form-group col-md-5">
                        <label for="exampleFormControlSelect2">Detalhamento de exemplo utilizando-se o máximo de parcelas</label>
                        <select multiple class="form-control" id="detalhamentoParcelas" name="detalhamentoParcelas">
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                        </select>
                    </div>
                </div>
                <h5>Vencimento</h5>
                <div class="form-row">
                    <div class="form-group col-md-4">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="vencimento" id="permitirDefinirVencimento1" value="false" checked>
                            <label class="form-check-label" for="exampleRadios1">
                            Permitir definir vencimento no ato da matrícula
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="vencimento" id="definirVencimentoEspecifico" value="true">
                            <label class="form-check-label" for="exampleRadios2">
                            Definir datas específicas para o vencimento
                            </label>
                        </div>
                        <label for="inputEmail4">Adicione um dia</label>
                        <div class="input-group mb-3">
                            <input type="number" class="form-control" id="addDatasVencimento" name="addDatasVencimento" placeholder="Digite um dia (Ex.: 10)" disabled>
                            <div class="input-group-append">
                                <button class="btn btn-primary" type="button" id="btnAddDia" disabled><span data-feather="plus"></span>Adicionar</button>
                            </div>
                        </div>
                        
                        <small id="idPlano" class="form-text text-muted">Adicione os dias possíveis para vencimento.</small>
                    </div>
                    <div class="form-group col-md-2">
                        <label for="exampleFormControlSelect2">Dias escolhidos</label>
                        <select multiple class="form-control" id="diasDeVencimento" name="diasDeVencimento" disabled>
                            
                        </select>
                        <small id="idPlano" class="form-text text-muted">Clique em um dia para removê-lo.</small>
                    </div>
                    
                </div>
                <div class="form-row">
                    
                    <div class="form-group col-md-10">
                        <label for="exampleFormControlSelect2">Informações e Avisos</label>
                        <input class="form-control" type="text" id="descricaoPlano" name="descricaoPlano" placeholder="Informações e Avisos (Ex.: Em caso de atraso no pagamento será cobrado...)">
                        <small class="form-text text-muted">Estas informações aparecerão impressas em cada parcela de pagamento.</small>
                    </div>
                        
                </div>
                
              
              <button type="submit" class="btn btn-primary btn-block">Adicionar plano</button>
            </form>
            `, `<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>`)

            feather.replace()

            document.getElementsByName('vencimento').forEach(element => {
                element.addEventListener('click', (e) => {
                    console.log(e.target.value, e.target.checked)
                    if (e.target.value == 'false' && e.target.checked == true) {
                        document.getElementById('btnAddDia').disabled = true
                        document.getElementById('diasDeVencimento').disabled = true
                        document.getElementById('addDatasVencimento').disabled = true
                    } else {
                        document.getElementById('btnAddDia').disabled = false
                        document.getElementById('diasDeVencimento').disabled = false
                        document.getElementById('addDatasVencimento').disabled = false
                        document.getElementById('diasDeVencimento').innerHTML = ''
                    }
                })
            })

            document.getElementById('btnAddDia').addEventListener('click', (e) => {
                let dia = document.getElementById('addDatasVencimento')
                addDia(dia.value)
                dia.value = ''
            })
            
            function addDia(dia) {
                if (dia < 1 || dia > 28) {
                    AstNotif.dialog('Opa...', 'Por favor, escolha um dia entre os dias 1 e 28')
                } else {
                    document.getElementById('diasDeVencimento').innerHTML += `<option onclick="this.remove()" id="dia${dia}" value="${dia}" selected>${dia}</option>`
                }
            }

            function addParcela(dadosParcela='') {
                if (dadosParcela == '') {
                    document.getElementById('detalhamentoParcelas').innerHTML = ''
                } else {
                    document.getElementById('detalhamentoParcelas').innerHTML += `<option>${dadosParcela}</option>`
                }
                
            }

            let formAddPlanoCurso = document.getElementById('addPlanoCurso')
            formAddPlanoCurso.addEventListener('change', async (e) => {
                let dadosForm = $("#addPlanoCurso").serializeArray()
                let formData = new FormData(formAddPlanoCurso)
                // Objeto contendo os dados do plano par enviar ao firebase
                let data = {}
                console.log(dadosForm)
                dadosForm.forEach(field => {
                    let values = formData.getAll(field.name)
                    values.length == 1 ? data[field.name] = values[0] : data[field.name] = values
                })
                console.log(data)
                try {

                    
                    
                    //data.valorDesconto = (Number(data.valorCurso) * (data.descontoPlano/100)).toFixed(2)
                    data.descontoPlano = ((100 * data.valorDesconto)/data.valorCurso)
                    
                    data.valorAcrescimo = (Number(data.valorCurso) * (data.acrescimoPlano/100)).toFixed(2)
                    data.valorFinal = (Number(data.valorCurso) + (data.valorAcrescimo - data.valorDesconto)).toFixed(2)
                    addParcela()
                    document.getElementById('quandoAplicar').innerHTML = '<option hidden selected>Escolha a parcela...</option>'
                    for (let i = 0; i < data.numeroMaximoParcelasPlano; i++) {
                        document.getElementById('quandoAplicar').innerHTML += `<option value="${i}">Parcela ${i + 1}</option>`
                    }
                    let saldo = data.valorCurso
                    let saldoAcrescimo = data.valorAcrescimo
                    let saldoDesconto = data.valorDesconto
                    let contadorParcelas = data.numeroMaximoParcelasPlano
                    let somaParcelas = 0
                    let valorParcelaGlobal = 0
                    for (let parcela = 0; parcela < data.numeroMaximoParcelasPlano; parcela++) {
                        let parcelaText
                        if (data.distribuirAcrescimosEDescontos == 'on') {
                            document.getElementById('quandoAplicar').disabled = false
                            
                            
                            let acrescimoParcela 
                            let descontoParcela 
                            let valorParcela
                            parcela == 0 ? valorParcelaGlobal = parseFloat(saldo / contadorParcelas).toFixed(2) : null
                            if (parcela >= data.quandoAplicar) {
                                // parcela == data.quandoAplicar ? saldo = data.valorFinal - somaParcelas : null
                                parcela == data.quandoAplicar ? valorParcelaGlobal = parseFloat(saldo / contadorParcelas).toFixed(2) : null
                                valorParcela = valorParcelaGlobal
                                acrescimoParcela = (saldoAcrescimo/contadorParcelas).toFixed(2)
                                descontoParcela = (saldoDesconto/contadorParcelas).toFixed(2)
                                // saldo = (Number(saldo) - valorParcela) - Number(acrescimoParcela - descontoParcela)
                            } else {
                                valorParcela = valorParcelaGlobal
                                
                                // saldo = saldo - valorParcela
                                acrescimoParcela = 0
                                descontoParcela = 0
                            }
                            
                            saldoAcrescimo = saldoAcrescimo - acrescimoParcela
                            saldoDesconto = saldoDesconto - descontoParcela
                            
                            data.quandoAplicar != undefined ? parcelaText = `Parcela ${parcela + 1}: R$${valorParcela} ${acrescimoParcela != 0 || acrescimoParcela != '' ? '+ R$' + acrescimoParcela : ''} ${descontoParcela != 0 || descontoParcela != '' ? '- R$' + descontoParcela : ''} = R$${(Number(valorParcela) + (acrescimoParcela - descontoParcela)).toFixed(2)}` : null
                            somaParcelas += (Number(valorParcela) + (acrescimoParcela - descontoParcela))
                        } else {
                            parcela == 0 ? saldo = data.valorFinal : null
                            document.getElementById('quandoAplicar').disabled = true
                            document.getElementById('quandoAplicar').innerHTML = ''
                             parcelaText = `Parcela ${parcela + 1}:  R$${parseFloat(data.valorFinal / data.numeroMaximoParcelasPlano).toFixed(2)}`
                            // saldo = saldo - parseFloat(data.valorFinal / data.numeroMaximoParcelasPlano).toFixed(2)
                            somaParcelas += Number(parseFloat(data.valorFinal / data.numeroMaximoParcelasPlano))
                        }
                        saldo = (parcela >= data.quandoAplicar ? data.valorFinal : data.valorCurso) - somaParcelas
                        console.log(saldo)
                        addParcela(parcelaText)
                        // addParcela(`Saldo: R$${saldo}`)
                        contadorParcelas--
                    }
                    addParcela(`Total: R$${somaParcelas.toFixed(2)}`)

                } catch (error) {
                    console.log(error)
                }

                for (const id in data) {
                    if (Object.hasOwnProperty.call(data, id)) {
                        const value = data[id];
                        id == 'vencimento' ? document.getElementsByName(id).value = value : document.getElementById(id).value = value
                    }
                }
            })
            

            formAddPlanoCurso.addEventListener('submit', (e) => {
                e.preventDefault()
                loaderRun(true, 'Enviando dados do plano...')
                let obj = document.getElementById('diasDeVencimento')
                try {
                    for (var i = 0; i < obj.options.length; i++) {
                        obj.options[i].selected = true;
                    }  
                } catch (error) {
                    console.log(error)
                }
                
                
                
                let dadosForm = $("#addPlanoCurso").serializeArray()
                let formData = new FormData(formAddPlanoCurso)
                let data = {}
                console.log(dadosForm)
                dadosForm.forEach(field => {
                    let values = formData.getAll(field.name)
                    values.length == 1 ? data[field.name] = values[0] : data[field.name] = values
                })
                data.codCurso = codSistema
                console.log(data)
                cursosRef.child(listaCursos.value + '/planos').push(data).then(() => {
                    loaderRun()
                    AstNotif.notify('Sucesso', 'Dados enviados com sucesso!')
                    $('#modal').modal('hide')
                }).catch(error => {
                    AstNotif.dialog('Erro', error.message)
                })
            })


        }
        
    })

    listaCursos.addEventListener('change', (e) => {
        let codSistema = e.target.value
        mostraPlanos(codSistema)
    })

    

    loaderRun()
}