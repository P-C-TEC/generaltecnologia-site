// Roda DENTRO da página do app (injetado por capturar-app.mjs). Cadastra dados fictícios numa
// conta de demonstração para as telas da página de vendas. Nada aqui é dado real: restaurante,
// pessoas, fornecedores e valores são inventados, e as imagens anexadas dizem "demonstração".
;(() => {
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms))
  const raiz = () => document.querySelector('main') || document.body
  const dialogo = () => document.querySelector('[role=dialog]')
  const botao = (t, el = document) => [...el.querySelectorAll('button')].find((b) => b.innerText.trim() === t)
  const botaoIni = (t, el = document) => [...el.querySelectorAll('button')].find((b) => b.innerText.trim().startsWith(t))

  function setv(el, v) {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
  function selTexto(el, t) {
    const o = [...el.options].find((o) => o.text === t || o.text.startsWith(t + ' ('))
    if (!o) throw new Error(`opção "${t}" não encontrada`)
    setv(el, o.value)
  }
  async function imagemDemo(txt) {
    const c = document.createElement('canvas')
    c.width = 600
    c.height = 400
    const g = c.getContext('2d')
    g.fillStyle = '#f4f4f4'
    g.fillRect(0, 0, 600, 400)
    g.fillStyle = '#333'
    g.textAlign = 'center'
    g.font = 'bold 28px sans-serif'
    g.fillText(txt, 300, 190)
    g.font = '20px sans-serif'
    g.fillText('Imagem de demonstração', 300, 230)
    const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85))
    return new File([b], 'demonstracao.jpg', { type: 'image/jpeg' })
  }
  async function anexar(input, txt) {
    const dt = new DataTransfer()
    dt.items.add(await imagemDemo(txt))
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
  async function ir(g, s) {
    const nav = document.querySelector('nav')
    const achar = (t) => [...nav.querySelectorAll('button,a')].find((x) => x.innerText.trim() === t)
    achar(g).click()
    await dormir(400)
    if (s) {
      if (!achar(s)) { achar(g).click(); await dormir(400) }
      achar(s).click()
    }
    await dormir(2000)
  }

  async function configurar() {
    if (!document.body.innerText.includes('Configure seu Restaurante')) return 'já configurado'
    const i = [...document.querySelectorAll('input')]
    setv(i[0], 'Bistrô Exemplo LTDA')
    setv(i[1], '12.345.678/0001-95')
    setv(i[2], 'Rua Exemplo, 100, Centro, Itabuna, BA')
    setv(i[3], '(73) 90000-0000')
    await dormir(300)
    botao('Próximo').click()
    await dormir(2000)
    botaoIni('Restaurante / Buffet').click()
    await dormir(1200)
    botaoIni('À la carte').click()
    await dormir(300)
    botao('Continuar').click()
    await dormir(2000)
    botao('Finalizar Cadastro').click()
    await dormir(5000)
    const f = botao('Fechar', raiz())
    f?.click()
    return 'configurado'
  }

  async function insumos() {
    await ir('Estoque', 'Estoque de Insumos')
    const L = [
      ['Arroz branco', 'Quilograma (kg)', 'Não Perecíveis', 'Cozinha Geral', 42, 4, 'Distribuidora Exemplo', 5.8],
      ['Feijão carioca', 'Quilograma (kg)', 'Não Perecíveis', 'Cozinha Geral', 18, 2.5, 'Distribuidora Exemplo', 8.9],
      ['Filé mignon', 'Quilograma (kg)', 'Congelados', 'Cozinha Quente', 6, 3, 'Frigorífico Modelo', 79.9],
      ['Peito de frango', 'Quilograma (kg)', 'Congelados', 'Cozinha Quente', 40, 5, 'Frigorífico Modelo', 18.5],
      ['Salmão em postas', 'Quilograma (kg)', 'Congelados', 'Cozinha Quente', 2, 1.5, 'Pescados Exemplo', 89],
      ['Batata inglesa', 'Quilograma (kg)', 'Perecíveis', 'Cozinha Geral', 55, 6, 'Hortifrúti Exemplo', 4.2],
      ['Tomate', 'Quilograma (kg)', 'Perecíveis', 'Cozinha Geral', 5, 3, 'Hortifrúti Exemplo', 6.5],
      ['Cebola', 'Quilograma (kg)', 'Perecíveis', 'Cozinha Geral', 20, 2, 'Hortifrúti Exemplo', 4.8],
      ['Alface americana', 'Unidade', 'Perecíveis', 'Cozinha Geral', 48, 6, 'Hortifrúti Exemplo', 3.5],
      ['Queijo muçarela', 'Quilograma (kg)', 'Perecíveis', 'Cozinha Quente', 14, 1.5, 'Laticínios Exemplo', 38],
      ['Creme de leite', 'Litro (L)', 'Perecíveis', 'Cozinha Quente', 12, 1, 'Laticínios Exemplo', 14],
      ['Azeite extravirgem', 'Litro (L)', 'Condimentos', 'Cozinha Quente', 6, 0.5, 'Distribuidora Exemplo', 42],
      ['Óleo de soja', 'Litro (L)', 'Não Perecíveis', 'Cozinha Quente', 30, 3, 'Distribuidora Exemplo', 7.9],
      ['Refrigerante lata', 'Unidade', 'Bebidas', 'Salão', 240, 30, 'Bebidas Exemplo', 3.2],
      ['Água mineral 500 ml', 'Unidade', 'Bebidas', 'Salão', 220, 25, 'Bebidas Exemplo', 1.4],
      ['Suco de laranja natural', 'Litro (L)', 'Bebidas', 'Salão', 32, 4, 'Hortifrúti Exemplo', 9],
      ['Vinho tinto da casa', 'Unidade', 'Adega', 'Salão', 18, 1, 'Adega Exemplo', 39],
      ['Guardanapo de papel', 'Pacote', 'Descartáveis', 'Salão', 22, 2, 'Descartáveis Exemplo', 6.5],
      ['Embalagem para viagem', 'Unidade', 'Descartáveis', 'Cozinha Geral', 150, 20, 'Descartáveis Exemplo', 1.1],
      ['Detergente neutro', 'Litro (L)', 'Higiene', 'Limpeza', 8, 0.5, 'Limpeza Exemplo', 5.5],
    ]
    for (const [n, un, cat, setor, qtd, uso, forn, custo] of L) {
      botao('Adicionar Insumo', raiz()).click()
      await dormir(900)
      const d = dialogo()
      const i = [...d.querySelectorAll('input,select')]
      setv(i[0], n); selTexto(i[1], un); selTexto(i[2], cat); selTexto(i[3], setor)
      setv(i[4], String(qtd)); setv(i[5], String(uso)); setv(i[6], forn); setv(i[7], String(custo))
      await dormir(250)
      botao('Adicionar insumo', d).click()
      await dormir(1700)
    }
    return 'insumos ok'
  }

  async function equipe() {
    await ir('Equipe & RH', 'Escala e presença')
    botao('Colaboradores', raiz()).click()
    await dormir(1200)
    const L = [
      ['Ana Souza', 'Chef de cozinha', 'Cozinha Quente', 'Liderança / Supervisor'],
      ['Bruno Lima', 'Cozinheiro', 'Cozinha Quente', 'Cozinha / Estoque'],
      ['Carla Mendes', 'Auxiliar de cozinha', 'Cozinha Geral', 'Cozinha / Estoque'],
      ['Diego Rocha', 'Garçom', 'Salão', 'Garçom / Limpeza'],
      ['Elisa Martins', 'Garçonete', 'Salão', 'Garçom / Limpeza'],
      ['Fábio Costa', 'Estoquista', 'Almoxarifado', 'Cozinha / Estoque'],
      ['Gabriela Nunes', 'Caixa', 'Caixa / Recepção', 'Garçom / Limpeza'],
      ['Hugo Pereira', 'Auxiliar de limpeza', 'Limpeza', 'Garçom / Limpeza'],
      ['Íris Almeida', 'Gerente', 'Gerencial', 'Gerencial'],
    ]
    for (const [n, cargo, setor, func] of L) {
      botao('Cadastrar colaborador', raiz()).click()
      await dormir(900)
      const d = dialogo()
      const i = [...d.querySelectorAll('input,select')]
      setv(i[0], n); setv(i[3], cargo); selTexto(i[4], setor); selTexto(i[5], func); selTexto(i[6], 'Ativo')
      await dormir(200)
      botao('Salvar colaborador', d).click()
      await dormir(1500)
    }
    return 'equipe ok'
  }

  async function escalaEPresenca() {
    const m = raiz()
    botao('Escala da semana', m).click()
    await dormir(1500)
    // Entrada alguns minutos antes de agora, para a presença não sair como atraso.
    const agora = new Date(Date.now() - 10 * 60_000)
    const hh = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
    const ent = hh(agora)
    const sai = hh(new Date(Math.min(agora.getTime() + 6 * 3600_000, new Date().setHours(23, 30, 0, 0))))
    const pessoas = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Rocha', 'Elisa Martins', 'Fábio Costa', 'Gabriela Nunes', 'Hugo Pereira', 'Íris Almeida']
    const hoje = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date().getDay()]
    for (const p of pessoas) {
      botaoIni(p + '\n', m).click()
      await dormir(700)
      const dia = () => botaoIni(hoje + '\n', m)
      dia().click()
      await dormir(500)
      if (!m.querySelector('input[type=time]')) { dia().click(); await dormir(500) }
      const cb = m.querySelector('input[type=checkbox]')
      if (cb && !cb.checked) { cb.click(); await dormir(300) }
      const ts = [...m.querySelectorAll('input[type=time]')]
      setv(ts[0], ent); ts[0].dispatchEvent(new Event('blur', { bubbles: true }))
      setv(ts[1], sai); ts[1].dispatchEvent(new Event('blur', { bubbles: true }))
      await dormir(1000)
    }
    botao('Presença de hoje', m).click()
    await dormir(2000)
    for (const nome of pessoas.filter((p) => p !== 'Gabriela Nunes')) {
      const el = [...m.querySelectorAll('*')].find((e) => e.childElementCount === 0 && e.textContent.trim() === nome)
      let c = el
      while (c && !botao('Presente', c)) c = c.parentElement
      botao('Presente', c).click()
      await dormir(900)
    }
    return 'escala e presença ok'
  }

  async function checklists() {
    await ir('Checklists', 'Modelos e rotinas')
    const rotinas = botao('Rotinas prontas', raiz()) ?? botao('Ver as rotinas prontas', raiz())
    // Às vezes a conta já vem com as rotinas da biblioteca configuradas e o botão não aparece.
    if (rotinas) {
      rotinas.click()
      await dormir(1500)
      botaoIni('Adicionar', dialogo() ?? document)?.click()
      await dormir(4000)
    }
    await ir('Checklists', 'Preencher hoje')
    const m = raiz()
    const aba = botaoIni('Abertura\n', m)
    if (!aba) throw new Error('sem aba Abertura: ' + m.innerText.slice(0, 200))
    aba.click()
    await dormir(1200)
    for (const b of [...m.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Conforme')) { b.click(); await dormir(60) }
    await dormir(800)
    for (const b of [...m.querySelectorAll('button')].filter((b) => b.innerText.startsWith('Enviar') && !b.disabled)) {
      b.click()
      await dormir(2500)
    }
    return 'checklists ok'
  }

  async function fichas() {
    await ir('Cardápio & Fichas', 'Ficha Técnica')
    const L = [
      ['Filé ao molho de mostarda', 'Prato Principal', 68, [['Filé mignon', 0.22], ['Creme de leite', 0.08], ['Batata inglesa', 0.2], ['Azeite extravirgem', 0.01]]],
      ['Salmão grelhado com legumes', 'Prato Principal', 74, [['Salmão em postas', 0.2], ['Batata inglesa', 0.15], ['Azeite extravirgem', 0.015], ['Tomate', 0.05]]],
      ['Frango à parmegiana', 'Prato Principal', 49, [['Peito de frango', 0.25], ['Queijo muçarela', 0.08], ['Tomate', 0.1], ['Arroz branco', 0.12], ['Óleo de soja', 0.05]]],
      ['Prato executivo', 'Prato Principal', 32, [['Peito de frango', 0.18], ['Arroz branco', 0.15], ['Feijão carioca', 0.1], ['Alface americana', 0.15], ['Tomate', 0.05]]],
      ['Salada da casa', 'Salada', 29, [['Alface americana', 0.5], ['Tomate', 0.12], ['Cebola', 0.04], ['Queijo muçarela', 0.05], ['Azeite extravirgem', 0.015]]],
      ['Batata frita', 'Guarnição', 24, [['Batata inglesa', 0.35], ['Óleo de soja', 0.08]]],
      ['Suco de laranja 400 ml', 'Bebida', 12, [['Suco de laranja natural', 0.4]]],
      ['Refrigerante lata', 'Bebida', 7, [['Refrigerante lata', 1]]],
    ]
    for (const [nome, cat, preco, ings] of L) {
      botao('Nova Ficha Técnica', raiz()).click()
      await dormir(1200)
      const d = dialogo()
      const i = [...d.querySelectorAll('input,select')]
      setv(i[0], nome); selTexto(i[2], cat); setv(i[3], String(preco))
      for (const [ins, q] of ings) {
        selTexto([...d.querySelectorAll('select')][1], ins)
        await dormir(400)
        const qs = [...d.querySelectorAll('input[placeholder=Qtd]')]
        setv(qs[qs.length - 1], String(q))
        await dormir(150)
      }
      await dormir(300)
      botao('Salvar Ficha Técnica', d).click()
      await dormir(2000)
    }
    return 'fichas ok'
  }

  async function financeiro() {
    await ir('Financeiro & Perdas', 'Caixa e perdas')
    let m = raiz()
    let i = [...m.querySelectorAll('input')]
    setv(i[0], '8460'); setv(i[1], '132'); setv(i[2], '3820'); setv(i[3], '1890'); setv(i[4], '2150'); setv(i[5], '600')
    await anexar(m.querySelector('input[type=file]'), 'Comprovante do terminal')
    await dormir(1500)
    botao('Registrar Fechamento de Caixa', m).click()
    await dormir(3500)
    botao('Perdas', m).click()
    await dormir(1500)
    for (const [ins, q, mot] of [['Tomate', 1.5, 'Estragou'], ['Creme de leite', 0.5, 'Venceu'], ['Peito de frango', 0.8, 'Erro de preparo'], ['Refrigerante lata', 2, 'Quebra / derrubado']]) {
      const s = [...m.querySelectorAll('select')]
      selTexto(s[0], ins)
      setv(m.querySelector('input[placeholder="0,00"]'), String(q))
      selTexto([...m.querySelectorAll('select')][1], mot)
      await dormir(200)
      botao('Registrar', m).click()
      await dormir(1800)
    }
    await ir('Financeiro & Perdas', 'Entradas e saídas')
    m = raiz()
    const ano = new Date().getFullYear()
    const mes = String(new Date().getMonth() + 1).padStart(2, '0')
    const dia = (d) => `${ano}-${mes}-${String(Math.min(d, new Date().getDate())).padStart(2, '0')}`
    const L = [
      [dia(1), 'Outros', 'Entrada (Receita)', 'Vendas do salão — dia 1', 1, 'Unidade', 7920],
      [dia(2), 'Outros', 'Entrada (Receita)', 'Vendas do salão — dia 2', 1, 'Unidade', 9340],
      [dia(3), 'Outros', 'Entrada (Receita)', 'Vendas do salão — dia 3', 1, 'Unidade', 11280],
      [dia(1), 'Proteínas', 'Saída (Despesa)', 'Filé mignon', 12, 'Quilograma (kg)', 79.9],
      [dia(1), 'Proteínas', 'Saída (Despesa)', 'Peito de frango', 30, 'Quilograma (kg)', 18.5],
      [dia(2), 'Hortifruti', 'Saída (Despesa)', 'Hortifrúti da semana', 1, 'Unidade', 640],
      [dia(2), 'Bebidas', 'Saída (Despesa)', 'Refrigerantes e águas', 1, 'Unidade', 980],
      [dia(3), 'Grãos & Cereais', 'Saída (Despesa)', 'Arroz e feijão', 1, 'Unidade', 420],
      [dia(1), 'Aluguel & Ocupação', 'Saída (Despesa)', 'Aluguel do mês', 1, 'Unidade', 6500],
      [dia(2), 'Energia & Utilities', 'Saída (Despesa)', 'Conta de energia', 1, 'Unidade', 1840],
      [dia(3), 'Taxas de Cartão & Apps', 'Saída (Despesa)', 'Taxas das maquininhas', 1, 'Unidade', 310],
    ]
    for (const [dt, cc, tipo, desc, q, un, vu] of L) {
      i = [...m.querySelectorAll('input,select')]
      setv(i[3], dt); selTexto(i[4], cc); selTexto(i[5], tipo); setv(i[6], desc); setv(i[7], String(q)); selTexto(i[8], un); setv(i[9], String(vu))
      await dormir(250)
      botao('Adicionar Lançamento', m).click()
      await dormir(1600)
    }
    return 'financeiro ok'
  }

  const emDias = (n) => { const d = new Date(Date.now() + n * 864e5); return d.toISOString().slice(0, 10) }

  async function ativos() {
    await ir('Ativos & Manutenção')
    const L = [
      ['Forno combinado', '10 GN 1/1', 'Cozinha Quente', 'Linha quente', '2024-03-10', emDias(16), 'Trimestral', 'Ativo'],
      ['Câmara fria de resfriados', '2,5 x 2 m', 'Cozinha Geral', 'Corredor de estoque', '2023-08-01', emDias(-6), 'Mensal', 'Ativo'],
      ['Coifa e exaustor', 'Inox 3 m', 'Cozinha Quente', 'Sobre a linha quente', '2023-08-01', emDias(4), 'Trimestral', 'Ativo'],
      ['Fritadeira elétrica', '2 cubas 10 L', 'Cozinha Quente', 'Linha quente', '2025-01-15', emDias(11), 'Mensal', 'Em Manutenção'],
      ['Ar-condicionado do salão', 'Split 24.000 BTUs', 'Salão', 'Salão principal', '2024-11-05', emDias(62), 'Semestral', 'Ativo'],
      ['Máquina de lavar louça', 'Capota 60 cestos/h', 'Cozinha Geral', 'Área de lavagem', '2024-06-20', emDias(47), 'Trimestral', 'Ativo'],
    ]
    for (const [n, mod, setor, loc, inst, prox, per, st] of L) {
      botaoIni('+ Novo Ativo', raiz()).click()
      await dormir(1100)
      const d = dialogo()
      const i = [...d.querySelectorAll('input,select')]
      setv(i[0], n); setv(i[1], mod); setv(i[2], setor); setv(i[3], loc); setv(i[4], inst); setv(i[5], prox); selTexto(i[6], per); selTexto(i[8], st)
      await dormir(250)
      botao('Salvar ativo', d).click()
      await dormir(1800)
    }
    return 'ativos ok'
  }

  async function documentos() {
    await ir('Documentos & Licenças')
    const L = [
      ['Alvará de funcionamento', 'Prefeitura Municipal', 'Licença / Alvará', emDias(178)],
      ['Licença sanitária', 'Vigilância Sanitária', 'Licença / Alvará', emDias(21)],
      ['AVCB (Corpo de Bombeiros)', 'Corpo de Bombeiros', 'Licença / Alvará', emDias(315)],
      ['Dedetização e controle de pragas', 'Empresa de controle de pragas', 'Rotina periódica obrigatória', emDias(8), 'Trimestral'],
      ["Limpeza da caixa d'água", 'Empresa de higienização', 'Rotina periódica obrigatória', emDias(129), 'Semestral'],
      ['Manutenção dos extintores', 'Empresa credenciada', 'Rotina periódica obrigatória', emDias(-4), 'Anual'],
    ]
    for (const [n, org, cls, venc, per] of L) {
      botao('Adicionar Documento', raiz()).click()
      await dormir(1100)
      const d = dialogo()
      let i = [...d.querySelectorAll('input,select,textarea')]
      setv(i[0], n); setv(i[1], org); selTexto(i[2], cls)
      await dormir(300)
      i = [...d.querySelectorAll('input,select,textarea')]
      if (per) selTexto(i.filter((x) => x.tagName === 'SELECT')[1], per)
      setv(i.find((x) => x.type === 'date'), venc)
      await dormir(200)
      ;[...d.querySelectorAll('button')].find((b) => /^Adicionar (Documento|Rotina)$/.test(b.innerText.trim())).click()
      await dormir(1800)
    }
    return 'documentos ok'
  }

  async function reservas() {
    await ir('Eventos & Reservas')
    const m = raiz()
    const L = [
      [emDias(0), '20:00', 8, 'Aniversário', 'Salão principal', 'Marina Teixeira', '3h', '', 'Bolo trazido pelo cliente', 'Confirmado'],
      [emDias(5), '12:30', 25, 'Almoço corporativo', 'Terraço', 'Rafael Moura', '12:30 às 15:00', 2250, 'Menu executivo fechado', 'Confirmado'],
      [emDias(8), '13:00', 14, 'Almoço de família', 'Salão principal', 'Patrícia Lopes', '3h', '', 'Duas cadeirinhas de bebê', 'Aguardando'],
      [emDias(13), '19:30', 40, 'Confraternização', 'Salão principal', 'Tiago Barros', '19:30 às 23:30', 5600, 'Buffet com 3 opções de prato', 'Confirmado'],
    ]
    for (const [dt, hr, qt, tipo, local, resp, dur, val, obs, st] of L) {
      let i = [...m.querySelectorAll('input,select,textarea')]
      if (!(i[3]?.placeholder || '').startsWith('Ex: Casamento')) {
        botao('+ Nova Reserva', m).click()
        await dormir(1000)
        i = [...m.querySelectorAll('input,select,textarea')]
      }
      setv(i[0], dt); setv(i[1], hr); setv(i[2], String(qt)); setv(i[3], tipo); setv(i[4], local); setv(i[5], resp); setv(i[8], dur); setv(i[9], String(val)); setv(i[10], obs)
      botao(st, m).click()
      await dormir(250)
      botao('Adicionar Reserva', m).click()
      await dormir(1800)
    }
    return 'reservas ok'
  }

  window.__demo = { configurar, insumos, equipe, escalaEPresenca, checklists, fichas, financeiro, ativos, documentos, reservas }
})()
