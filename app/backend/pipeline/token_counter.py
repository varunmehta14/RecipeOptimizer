import threading
from typing import Dict, Any, List, Optional
from langchain_core.callbacks.base import BaseCallbackHandler

# Thread-local storage for token counts
_thread_local = threading.local()

class LangchainTokenCounter(BaseCallbackHandler):
    """Callback handler for counting tokens in LangChain LLM calls."""
    
    def __init__(self):
        """Initialize the token counter."""
        super().__init__()
        # Initialize token count in thread-local storage
        if not hasattr(_thread_local, 'total_tokens'):
            _thread_local.total_tokens = 0
    
    def on_llm_start(self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any) -> None:
        """Reset token count when LLM starts."""
        _thread_local.total_tokens = 0
    
    def on_llm_end(self, response: Any, **kwargs: Any) -> None:
        """Extract token usage from the LLM response."""
        try:
            # Try to get token usage from different model providers
            if hasattr(response, 'llm_output'):
                llm_output = response.llm_output
                if isinstance(llm_output, dict):
                    # OpenAI-style token count
                    if 'token_usage' in llm_output:
                        token_usage = llm_output['token_usage']
                        if isinstance(token_usage, dict) and 'total_tokens' in token_usage:
                            _thread_local.total_tokens = token_usage['total_tokens']
                    # Anthropic-style token count
                    elif 'usage' in llm_output:
                        usage = llm_output['usage']
                        if isinstance(usage, dict) and 'total_tokens' in usage:
                            _thread_local.total_tokens = usage['total_tokens']
            
            # Google Generative AI token count might be in a different location
            if hasattr(response, 'generations'):
                for gen in response.generations:
                    for g in gen:
                        if hasattr(g, 'generation_info') and g.generation_info:
                            if 'token_count' in g.generation_info:
                                _thread_local.total_tokens = g.generation_info['token_count']
                            elif 'usage' in g.generation_info:
                                usage = g.generation_info['usage']
                                if isinstance(usage, dict) and 'total_tokens' in usage:
                                    _thread_local.total_tokens = usage['total_tokens']
        except Exception:
            # If any error occurs, we just continue without counting tokens
            pass

def get_token_count() -> Optional[int]:
    """Get the current token count."""
    return getattr(_thread_local, 'total_tokens', None)

def reset_token_count() -> None:
    """Reset the token count."""
    _thread_local.total_tokens = 0 