import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React from 'react'
import { Save } from 'lucide-react' // Added icon

type Props = {
  onSave?: () => void // Optional prop for save action
}

function PlaygroundHeader({ onSave }: Props) {
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className='flex justify-between items-center p-1'>
        <Image className='mt-15 ml-4 absolute' src={'/logo.svg'} alt='logo' width={140} height={140}/>
        {/* <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button> */}
    </div>
  )
}

export default PlaygroundHeader