-- Permitir acesso de leitura anônimo às campanhas (necessário até implementar autenticação real)
CREATE POLICY "Allow anon read all campaigns" 
ON public.campaigns 
FOR SELECT 
TO anon
USING (true);

-- Permitir acesso de leitura autenticado às campanhas
CREATE POLICY "Allow authenticated read all campaigns" 
ON public.campaigns 
FOR SELECT 
TO authenticated
USING (true);

-- Permitir acesso de leitura anônimo às companies (para créditos)
CREATE POLICY "Allow anon read all companies"
ON public.companies
FOR SELECT
TO anon
USING (true);

-- Permitir acesso de leitura autenticado às companies
CREATE POLICY "Allow authenticated read all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (true);