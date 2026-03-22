# Rollback de Produção

1. Abra o workflow **Deploy Production** no GitHub Actions e acione **Run workflow**.
2. Selecione `mode = rollback` e informe o nome do artefato que deseja reinstalar (ex.: `prod-123456789`).
3. Confirme a execução. O job irá baixar o artefato anterior e sincronizar novamente via `rsync` para o servidor configurado nos segredos `PROD_*`.
4. Valide a aplicação acessando o `/health` e o `/payments/health`.

> Importante: mantenha sempre pelo menos um artefato válido disponível (os artefatos são gerados automaticamente em cada deploy com `mode = deploy`). Ajuste o tempo de retenção conforme a sua política de release.

