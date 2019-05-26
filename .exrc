let g:ale_fix_on_save = 1

let g:ale_linters = {
  \ 'typescript': ['tsserver', 'tslint']
  \ }

let g:ale_fixers = {
  \ 'typescript': ['tslint', 'prettier']
  \ }
