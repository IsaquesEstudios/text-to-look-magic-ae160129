
GRANT EXECUTE ON FUNCTION public.check_login_rate_limit(text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean) TO anon;
